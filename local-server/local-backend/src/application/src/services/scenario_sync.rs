use std::sync::Arc;
use std::time::Duration;

use chrono::DateTime;

use local_server_core::{
    DomainError,
    entities::scenario::ScenarioStatus,
};

use crate::ports::{
    CloudScenarioClient, CreateCloudScenarioCmd, ScenarioRepository,
    scenario_repository::UpsertFromCloudCmd,
};

#[async_trait::async_trait]
pub trait ScenarioServiceUrlProvider: Send + Sync {
    async fn get(&self) -> String;
}

pub async fn run_scenario_sync(
    repo: Arc<dyn ScenarioRepository>,
    cloud: Arc<dyn CloudScenarioClient>,
    interval_secs: u64,
    scenario_service_url: Arc<dyn ScenarioServiceUrlProvider>,
) {
    loop {
        let base_url = scenario_service_url.get().await;
        tracing::info!(scenario_base = %base_url, "scenario_sync: cycle start");
        pull_from_cloud(&repo, &cloud, &base_url).await;
        push_local_to_cloud(&repo, &cloud, &base_url).await;
        tokio::time::sleep(Duration::from_secs(interval_secs)).await;
    }
}

async fn pull_from_cloud(
    repo: &Arc<dyn ScenarioRepository>,
    cloud: &Arc<dyn CloudScenarioClient>,
    base_url: &str,
) {
    match cloud.list_all(base_url).await {
        Ok(remote_scenarios) => {
            let count = remote_scenarios.len();
            for remote in remote_scenarios {
                let status = remote
                    .status
                    .parse::<ScenarioStatus>()
                    .unwrap_or(ScenarioStatus::Offline);

                let cloud_updated_at = DateTime::parse_from_rfc3339(&remote.updated_at)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now());

                if let Err(e) = repo
                    .upsert_from_cloud(
                        &remote.cloud_id,
                        UpsertFromCloudCmd {
                            name: remote.name,
                            description: remote.description,
                            house_id: remote.house_id,
                            creator_id: remote.creator_id,
                            definition: remote.definition,
                            status,
                            cloud_updated_at,
                        },
                    )
                    .await
                {
                    tracing::warn!(
                        error = %e,
                        cloud_id = %remote.cloud_id,
                        "scenario_sync: upsert failed"
                    );
                }
            }
            tracing::info!(count, "scenario_sync: pull complete");
        }
        Err(e) => {
            tracing::warn!(error = %e, "scenario_sync: cloud unavailable, skipping pull");
        }
    }
}

async fn push_local_to_cloud(
    repo: &Arc<dyn ScenarioRepository>,
    cloud: &Arc<dyn CloudScenarioClient>,
    base_url: &str,
) {
    let locals = match repo.list_without_cloud_id().await {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!(error = %e, "scenario_sync: list_without_cloud_id failed");
            return;
        }
    };

    for local in locals {
        let cmd = CreateCloudScenarioCmd {
            name: local.name.clone(),
            description: local.description.clone(),
            house_id: local.house_id.clone(),
            creator_id: local.creator_id.clone(),
            definition: local.definition.clone(),
            status: local.status.as_str().to_string(),
        };

        match cloud.create(base_url, cmd).await {
            Ok(created) => {
                if let Err(e) = repo.set_cloud_id(&local.id, &created.cloud_id).await {
                    tracing::warn!(
                        error = %e,
                        local_id = %local.id,
                        "scenario_sync: set_cloud_id failed"
                    );
                } else {
                    tracing::info!(
                        local_id = %local.id,
                        cloud_id = %created.cloud_id,
                        "scenario_sync: pushed local scenario to cloud"
                    );
                }
            }
            Err(DomainError::DependencyUnavailable(_)) => {
                tracing::warn!(local_id = %local.id, "scenario_sync: cloud unavailable, deferring push");
                return;
            }
            Err(e) => {
                tracing::warn!(
                    error = %e,
                    local_id = %local.id,
                    "scenario_sync: push to cloud failed"
                );
            }
        }
    }
}