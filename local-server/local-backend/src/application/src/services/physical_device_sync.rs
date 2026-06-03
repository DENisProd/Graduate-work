use std::sync::Arc;
use std::time::Duration;

use chrono::DateTime;

use crate::ports::{
    CloudPhysicalDeviceClient, CreateCloudPhysicalDeviceCmd, PhysicalDeviceRepository,
    UpsertPhysDevFromCloudCmd,
};

pub async fn run_physical_device_sync(
    repo: Arc<dyn PhysicalDeviceRepository>,
    cloud: Arc<dyn CloudPhysicalDeviceClient>,
    interval_secs: u64,
    scenario_service_url: String,
) {
    loop {
        pull_from_cloud(&repo, &cloud, &scenario_service_url).await;
        push_local_to_cloud(&repo, &cloud, &scenario_service_url).await;
        tokio::time::sleep(Duration::from_secs(interval_secs)).await;
    }
}

async fn pull_from_cloud(
    repo: &Arc<dyn PhysicalDeviceRepository>,
    cloud: &Arc<dyn CloudPhysicalDeviceClient>,
    base_url: &str,
) {
    match cloud.list_all(base_url).await {
        Ok(remotes) => {
            let count = remotes.len();
            for remote in remotes {
                let cloud_updated_at = DateTime::parse_from_rfc3339(&remote.updated_at)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now());

                if let Err(e) = repo
                    .upsert_from_cloud(
                        &remote.cloud_id,
                        remote.protocol_address.as_deref(),
                        UpsertPhysDevFromCloudCmd {
                            name: remote.name,
                            description: remote.description,
                            house_id: remote.house_id,
                            room_id: remote.room_id,
                            device_id: remote.device_id,
                            device_category_id: remote.device_category_id,
                            manufacturer_name: remote.manufacturer_name,
                            model: remote.model,
                            friendly_name: remote.friendly_name,
                            firmware_version: remote.firmware_version,
                            cloud_updated_at,
                        },
                    )
                    .await
                {
                    tracing::warn!(
                        error = %e,
                        cloud_id = %remote.cloud_id,
                        "physical_device_sync: upsert failed"
                    );
                }
            }
            tracing::info!(count, "physical_device_sync: pull complete");
        }
        Err(e) => {
            tracing::warn!(error = %e, "physical_device_sync: cloud unavailable, skipping pull");
        }
    }
}

async fn push_local_to_cloud(
    repo: &Arc<dyn PhysicalDeviceRepository>,
    cloud: &Arc<dyn CloudPhysicalDeviceClient>,
    base_url: &str,
) {
    let locals = match repo.list_without_cloud_id().await {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!(error = %e, "physical_device_sync: list_without_cloud_id failed");
            return;
        }
    };

    for local in locals {
        let Some(ref ieee) = local.protocol_address else {
            continue;
        };

        let cmd = CreateCloudPhysicalDeviceCmd {
            name: local.name.clone(),
            house_id: local.house_id.clone(),
            room_id: local.room_id.clone(),
            device_id: local.device_id,
            device_category_id: local.device_category_id,
            protocol_address: Some(ieee.clone()),
            manufacturer_name: local.manufacturer_name.clone(),
            model: local.model.clone(),
            friendly_name: local.friendly_name.clone(),
            firmware_version: local.firmware_version.clone(),
        };

        match cloud.create(base_url, cmd).await {
            Ok(created) => {
                if let Err(e) = repo.set_phys_cloud_id(local.id, &created.cloud_id).await {
                    tracing::warn!(error = %e, local_id = %local.id, "physical_device_sync: set_phys_cloud_id failed");
                } else {
                    tracing::info!(
                        local_id = %local.id,
                        cloud_id = %created.cloud_id,
                        ieee = %ieee,
                        "physical_device_sync: pushed local device to cloud"
                    );
                }
            }
            Err(local_server_core::DomainError::DependencyUnavailable(_)) => {
                tracing::warn!(local_id = %local.id, "physical_device_sync: cloud unavailable, deferring push");
                return;
            }
            Err(e) => {
                tracing::warn!(error = %e, local_id = %local.id, "physical_device_sync: push failed");
            }
        }
    }
}