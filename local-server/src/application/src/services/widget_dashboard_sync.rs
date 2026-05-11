use std::sync::Arc;
use std::time::Duration;

use chrono::DateTime;

use crate::ports::{
    CloudWidgetDashboardClient, CreateCloudWidgetDashboardCmd, WidgetDashboardRepository,
    UpsertFromCloudWidgetDashboardCmd,
};

pub async fn run_widget_dashboard_sync(
    repo: Arc<dyn WidgetDashboardRepository>,
    cloud: Arc<dyn CloudWidgetDashboardClient>,
    interval_secs: u64,
    scenario_service_url: String,
    house_ids: Vec<String>,
) {
    loop {
        for house_id in &house_ids {
            pull_from_cloud(&repo, &cloud, &scenario_service_url, house_id).await;
        }
        push_local_to_cloud(&repo, &cloud, &scenario_service_url).await;
        tokio::time::sleep(Duration::from_secs(interval_secs)).await;
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
                let cloud_updated_at = DateTime::parse_from_rfc3339(&remote.updated_at)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now());

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

async fn push_local_to_cloud(
    repo: &Arc<dyn WidgetDashboardRepository>,
    cloud: &Arc<dyn CloudWidgetDashboardClient>,
    base_url: &str,
) {
    let locals = match repo.list_without_cloud_id().await {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!(error = %e, "widget_dashboard_sync: list_without_cloud_id failed");
            return;
        }
    };

    for local in locals {
        let cmd = CreateCloudWidgetDashboardCmd {
            house_id: local.house_id.clone(),
            user_id: local.user_id.clone(),
            name: local.name.clone(),
            is_default: local.is_default,
            layouts: local.layouts.clone(),
            widgets: local.widgets.clone(),
        };

        match cloud.create(base_url, cmd).await {
            Ok(created) => {
                if let Err(e) = repo.set_cloud_id(&local.id, &created.cloud_id).await {
                    tracing::warn!(
                        error = %e,
                        local_id = %local.id,
                        "widget_dashboard_sync: set_cloud_id failed"
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
