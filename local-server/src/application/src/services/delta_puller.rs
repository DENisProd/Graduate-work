use std::sync::Arc;
use std::time::Duration;

use chrono::Utc;

use crate::ports::{AccessSyncRepository, CloudSyncClient};

/// Provides the base URL for cloud sync endpoints (usually access-service).
#[async_trait::async_trait]
pub trait CloudSyncUrlProvider: Send + Sync {
    async fn get(&self) -> String;
}

/// Background loop: on startup (and every `interval_secs`) pull delta from cloud.
/// Gracefully degrades if the cloud is unavailable.
pub async fn run_delta_puller(
    access_sync: Arc<dyn AccessSyncRepository>,
    cloud: Arc<dyn CloudSyncClient>,
    interval_secs: u64,
    cloud_api_url: Arc<dyn CloudSyncUrlProvider>,
    cloud_api_key: String,
    user_id_provider: Arc<dyn UserIdProvider>,
) {
    loop {
        let now = Utc::now();
        let status = match access_sync.get_status().await {
            Ok(s) => s,
            Err(e) => {
                tracing::warn!(error = %e, "delta_puller: get_status failed");
                tokio::time::sleep(Duration::from_secs(interval_secs)).await;
                continue;
            }
        };

        let since = status
            .last_pulled_at
            .as_deref()
            .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
            .map(|dt| dt.with_timezone(&Utc));

        let access_url = cloud_api_url.get().await;

        let result = match since {
            Some(ts) => cloud.delta(&access_url, &cloud_api_key, ts).await,
            None => {
                // First run: trigger a full house/room pull if we have a user
                if let Some(user_id) = user_id_provider.get().await {
                    let houses = cloud.fetch_user_houses(&access_url, &user_id).await;
                    match houses {
                        Ok(h) => {
                            access_sync.upsert_owner(&user_id).await.ok();
                            access_sync.upsert_houses(&h, &user_id).await.ok();
                            let mark = now.to_rfc3339();
                            access_sync.mark_pulled("houses", &mark).await.ok();
                            for house in &h {
                                if let Ok(rooms) =
                                    cloud.fetch_house_rooms(&access_url, &house.id).await
                                {
                                    access_sync.upsert_rooms(&house.id, &rooms).await.ok();
                                }
                            }
                            access_sync.mark_pulled("rooms", &mark).await.ok();
                            tracing::info!("delta_puller: initial full pull completed");
                        }
                        Err(e) => {
                            tracing::warn!(error = %e, "delta_puller: initial pull failed");
                        }
                    }
                }
                tokio::time::sleep(Duration::from_secs(interval_secs)).await;
                continue;
            }
        };

        match result {
            Ok(entries) => {
                tracing::info!(count = entries.len(), "delta_puller: received entries from cloud");
                // Entries are applied by the cloud push handler; here we just log
                let mark = now.to_rfc3339();
                access_sync.mark_pulled("delta", &mark).await.ok();
            }
            Err(e) => {
                tracing::warn!(error = %e, "delta_puller: cloud delta failed, skipping");
            }
        }

        tokio::time::sleep(Duration::from_secs(interval_secs)).await;
    }
}

/// Provides the current authenticated user's external ID at runtime.
#[async_trait::async_trait]
pub trait UserIdProvider: Send + Sync {
    async fn get(&self) -> Option<String>;
}
