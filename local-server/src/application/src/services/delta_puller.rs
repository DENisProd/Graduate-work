use std::sync::Arc;
use std::time::Duration;

use chrono::Utc;

use crate::ports::{AccessSyncRepository, CloudSyncClient};

/// Provides the base URL for cloud sync endpoints (usually access-service).
#[async_trait::async_trait]
pub trait CloudSyncUrlProvider: Send + Sync {
    async fn get(&self) -> String;
}

/// Provides the current authenticated user's external ID at runtime.
#[async_trait::async_trait]
pub trait UserIdProvider: Send + Sync {
    async fn get(&self) -> Option<String>;
}

/// Background loop: on startup (and every `interval_secs`) pull all houses,
/// rooms, and members from the cloud access-service into local SQLite.
///
/// The access-service has no incremental delta endpoint, so every cycle
/// performs a full pull. Gracefully degrades when the cloud is unavailable.
pub async fn run_delta_puller(
    access_sync: Arc<dyn AccessSyncRepository>,
    cloud: Arc<dyn CloudSyncClient>,
    interval_secs: u64,
    cloud_api_url: Arc<dyn CloudSyncUrlProvider>,
    user_id_provider: Arc<dyn UserIdProvider>,
) {
    loop {
        let now = Utc::now();
        let access_url = cloud_api_url.get().await;

        let user_id = match user_id_provider.get().await {
            Some(id) => id,
            None => {
                tokio::time::sleep(Duration::from_secs(interval_secs)).await;
                continue;
            }
        };

        // Full pull: houses
        let houses = match cloud.fetch_user_houses(&access_url, &user_id).await {
            Ok(h) => h,
            Err(e) => {
                tracing::warn!(error = %e, "delta_puller: fetch_user_houses failed, skipping cycle");
                tokio::time::sleep(Duration::from_secs(interval_secs)).await;
                continue;
            }
        };

        let house_count = houses.len();
        access_sync.upsert_owner(&user_id).await.ok();
        access_sync.upsert_houses(&houses, &user_id).await.ok();
        let mark = now.to_rfc3339();
        access_sync.mark_pulled("houses", &mark).await.ok();

        // Full pull: rooms per house
        let mut room_count = 0usize;
        for house in &houses {
            match cloud.fetch_house_rooms(&access_url, &house.id).await {
                Ok(rooms) => {
                    room_count += rooms.len();
                    access_sync.upsert_rooms(&house.id, &rooms).await.ok();
                }
                Err(e) => {
                    tracing::warn!(error = %e, house_id = %house.id, "delta_puller: fetch_house_rooms failed");
                }
            }
        }
        access_sync.mark_pulled("rooms", &mark).await.ok();

        // Full pull: members per house
        let mut member_count = 0usize;
        for house in &houses {
            match cloud.fetch_house_members(&access_url, &house.id).await {
                Ok(members) => {
                    member_count += members.len();
                    access_sync.upsert_members(&house.id, &members).await.ok();
                }
                Err(e) => {
                    tracing::warn!(error = %e, house_id = %house.id, "delta_puller: fetch_house_members failed");
                }
            }
        }
        access_sync.mark_pulled("members", &mark).await.ok();

        tracing::info!(
            houses = house_count,
            rooms = room_count,
            members = member_count,
            "delta_puller: pull complete"
        );

        tokio::time::sleep(Duration::from_secs(interval_secs)).await;
    }
}
