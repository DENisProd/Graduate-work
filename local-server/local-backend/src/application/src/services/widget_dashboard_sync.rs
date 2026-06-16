use std::sync::Arc;
use std::time::Duration;

use chrono::{DateTime, Utc};
use local_server_core::entities::widget_dashboard::WidgetDashboard;
use serde_json::Value;

use crate::ports::{
    remap_widget_modbus_ids, AccessSyncRepository, CloudModbusClient, CloudWidgetDashboardClient,
    CreateCloudWidgetDashboardCmd, ModbusRepository, UpdateCloudWidgetDashboardCmd,
    UpsertFromCloudWidgetDashboardCmd, WidgetDashboardRepository,
};
use crate::services::modbus_sync::sync_once;
use crate::services::{ScenarioServiceUrlProvider, UserIdProvider};

pub async fn run_widget_dashboard_sync(
    repo: Arc<dyn WidgetDashboardRepository>,
    cloud: Arc<dyn CloudWidgetDashboardClient>,
    modbus_repo: Arc<dyn ModbusRepository>,
    modbus_cloud: Arc<dyn CloudModbusClient>,
    interval_secs: u64,
    scenario_service_url: Arc<dyn ScenarioServiceUrlProvider>,
    access_sync: Arc<dyn AccessSyncRepository>,
    user_id_provider: Arc<dyn UserIdProvider>,
) {
    loop {
        let base_url = scenario_service_url.get().await;
        tracing::debug!(scenario_base = %base_url, "widget_dashboard_sync: cycle start");
        let house_ids = resolve_house_ids(&access_sync, &user_id_provider).await;
        let house_id = house_ids.first().map(|s| s.as_str());
        let modbus_map = match sync_once(&modbus_repo, &modbus_cloud, &base_url, house_id).await {
            Ok(map) => Some(map),
            Err(e) => {
                tracing::warn!(error = %e, "widget_dashboard_sync: modbus_sync failed");
                None
            }
        };
        push_local_to_cloud(
            &repo,
            &cloud,
            &base_url,
            modbus_map.as_ref(),
            &user_id_provider,
        )
        .await;
        push_linked_to_cloud(
            &repo,
            &cloud,
            &base_url,
            modbus_map.as_ref(),
            &user_id_provider,
        )
        .await;
        for house_id in &house_ids {
            pull_from_cloud(&repo, &cloud, &base_url, house_id).await;
        }
        tokio::time::sleep(Duration::from_secs(interval_secs)).await;
    }
}

async fn resolve_house_ids(
    access_sync: &Arc<dyn AccessSyncRepository>,
    user_id_provider: &Arc<dyn UserIdProvider>,
) -> Vec<String> {
    let Some(user_id) = user_id_provider.get().await else {
        return Vec::new();
    };
    access_sync
        .list_houses(&user_id)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|h| h.id)
        .collect()
}

fn is_placeholder_user_id(user_id: &str) -> bool {
    user_id.trim().is_empty() || user_id == "local"
}

async fn resolve_cloud_user_id(
    local_user_id: &str,
    user_id_provider: &Arc<dyn UserIdProvider>,
) -> Option<String> {
    if let Some(uid) = user_id_provider.get().await {
        if !uid.trim().is_empty() {
            return Some(uid);
        }
    }
    if !is_placeholder_user_id(local_user_id) {
        return Some(local_user_id.to_string());
    }
    None
}

fn parse_cloud_timestamp(value: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(value)
        .map(|dt| dt.with_timezone(&Utc))
        .or_else(|_| value.parse::<DateTime<Utc>>())
        .unwrap_or_else(|_| Utc::now())
}

fn local_dashboard_needs_push(local: &WidgetDashboard) -> bool {
    match local.last_pushed_at {
        None => true,
        Some(pushed) => local.updated_at > pushed,
    }
}

async fn pull_from_cloud(
    repo: &Arc<dyn WidgetDashboardRepository>,
    cloud: &Arc<dyn CloudWidgetDashboardClient>,
    base_url: &str,
    house_id: &str,
) {
    match cloud.list_by_house(base_url, house_id).await {
        Ok(remotes) => {
            let count = remotes.len();
            for remote in remotes {
                let cloud_updated_at = parse_cloud_timestamp(&remote.updated_at);

                if let Err(e) = repo
                    .upsert_from_cloud(
                        &remote.cloud_id,
                        UpsertFromCloudWidgetDashboardCmd {
                            house_id: remote.house_id,
                            user_id: remote.user_id,
                            name: remote.name,
                            is_default: remote.is_default,
                            layouts: remote.layouts,
                            widgets: remote.widgets,
                            cloud_updated_at,
                        },
                    )
                    .await
                {
                    tracing::warn!(
                        error = %e,
                        cloud_id = %remote.cloud_id,
                        "widget_dashboard_sync: upsert failed"
                    );
                }
            }
            tracing::info!(count, house_id, "widget_dashboard_sync: pull complete");
        }
        Err(e) => {
            tracing::warn!(
                error = %e,
                house_id,
                "widget_dashboard_sync: cloud unavailable, skipping pull"
            );
        }
    }
}

fn remap_widgets(
    widgets: &[Value],
    modbus_map: Option<&(Vec<(String, String)>, Vec<(String, String)>)>,
) -> Vec<Value> {
    let mut out = widgets.to_vec();
    if let Some((devices, registers)) = modbus_map {
        for widget in &mut out {
            remap_widget_modbus_ids(widget, devices, registers);
        }
    }
    out
}

async fn push_local_to_cloud(
    repo: &Arc<dyn WidgetDashboardRepository>,
    cloud: &Arc<dyn CloudWidgetDashboardClient>,
    base_url: &str,
    modbus_map: Option<&(Vec<(String, String)>, Vec<(String, String)>)>,
    user_id_provider: &Arc<dyn UserIdProvider>,
) {
    let locals = match repo.list_without_cloud_id().await {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!(error = %e, "widget_dashboard_sync: list_without_cloud_id failed");
            return;
        }
    };

    for local in locals {
        let Some(cloud_user_id) = resolve_cloud_user_id(&local.user_id, user_id_provider).await
        else {
            tracing::warn!(
                local_id = %local.id,
                "widget_dashboard_sync: skip push — no cloud user id (re-authorize local server)"
            );
            continue;
        };

        let widgets = remap_widgets(&local.widgets, modbus_map);
        let cmd = CreateCloudWidgetDashboardCmd {
            house_id: local.house_id.clone(),
            user_id: cloud_user_id,
            name: local.name.clone(),
            is_default: local.is_default,
            layouts: local.layouts.clone(),
            widgets,
        };

        match cloud.create(base_url, cmd).await {
            Ok(created) => {
                if let Err(e) = repo.set_cloud_id(&local.id, &created.cloud_id).await {
                    tracing::warn!(
                        error = %e,
                        local_id = %local.id,
                        "widget_dashboard_sync: set_cloud_id failed"
                    );
                } else if let Err(e) = repo
                    .mark_pushed_at(&local.id, parse_cloud_timestamp(&created.updated_at))
                    .await
                {
                    tracing::warn!(
                        error = %e,
                        local_id = %local.id,
                        "widget_dashboard_sync: mark_pushed_at failed"
                    );
                } else {
                    tracing::info!(
                        local_id = %local.id,
                        cloud_id = %created.cloud_id,
                        "widget_dashboard_sync: pushed local dashboard to cloud"
                    );
                }
            }
            Err(local_server_core::DomainError::DependencyUnavailable(_)) => {
                tracing::warn!(
                    local_id = %local.id,
                    "widget_dashboard_sync: cloud unavailable, deferring push"
                );
                return;
            }
            Err(e) => {
                tracing::warn!(
                    error = %e,
                    local_id = %local.id,
                    "widget_dashboard_sync: push failed"
                );
            }
        }
    }
}

async fn push_linked_to_cloud(
    repo: &Arc<dyn WidgetDashboardRepository>,
    cloud: &Arc<dyn CloudWidgetDashboardClient>,
    base_url: &str,
    modbus_map: Option<&(Vec<(String, String)>, Vec<(String, String)>)>,
    user_id_provider: &Arc<dyn UserIdProvider>,
) {
    let linked = match repo.list_with_cloud_id().await {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!(error = %e, "widget_dashboard_sync: list_with_cloud_id failed");
            return;
        }
    };

    if linked.is_empty() {
        return;
    }

    if resolve_cloud_user_id("", user_id_provider).await.is_none() {
        tracing::warn!(
            "widget_dashboard_sync: skip linked push — no cloud user id (re-authorize local server)"
        );
        return;
    }

    for local in linked {
        let Some(cloud_id) = local.cloud_id.clone() else {
            continue;
        };
        if !local_dashboard_needs_push(&local) {
            tracing::debug!(
                local_id = %local.id,
                cloud_id = %cloud_id,
                "widget_dashboard_sync: skip linked push — already synced"
            );
            continue;
        }
        let widgets = remap_widgets(&local.widgets, modbus_map);
        let cmd = UpdateCloudWidgetDashboardCmd {
            name: Some(local.name.clone()),
            is_default: Some(local.is_default),
            layouts: Some(local.layouts.clone()),
            widgets: Some(widgets),
        };

        match cloud.update(base_url, &cloud_id, cmd).await {
            Ok(updated) => {
                if let Err(e) = repo
                    .mark_pushed_at(&local.id, parse_cloud_timestamp(&updated.updated_at))
                    .await
                {
                    tracing::warn!(
                        error = %e,
                        local_id = %local.id,
                        "widget_dashboard_sync: mark_pushed_at failed"
                    );
                }
                tracing::info!(
                    local_id = %local.id,
                    cloud_id = %cloud_id,
                    widgets = local.widgets.len(),
                    "widget_dashboard_sync: updated linked dashboard on cloud"
                );
            }
            Err(local_server_core::DomainError::DependencyUnavailable(_)) => {
                tracing::warn!(
                    local_id = %local.id,
                    "widget_dashboard_sync: cloud unavailable, deferring linked push"
                );
                return;
            }
            Err(e) => {
                tracing::warn!(
                    error = %e,
                    local_id = %local.id,
                    cloud_id = %cloud_id,
                    "widget_dashboard_sync: linked push failed"
                );
            }
        }
    }
}
