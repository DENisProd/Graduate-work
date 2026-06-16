use std::sync::Arc;
use std::time::Duration;

use tokio::sync::Notify;

use crate::ports::{CloudSyncClient, SyncEntry};
use crate::services::CloudSyncUrlProvider;
use local_server_core::DomainError;

#[derive(Debug, Clone)]
pub struct PendingEntry {
    pub id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub operation: String,
    pub payload: serde_json::Value,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[async_trait::async_trait]
pub trait SyncOutboxRepository: Send + Sync {
    async fn find_pending(&self, limit: i64) -> Result<Vec<PendingEntry>, DomainError>;
    async fn mark_sent(&self, ids: &[String]) -> Result<(), DomainError>;
}

pub async fn run_outbox_pusher(
    outbox: Arc<dyn SyncOutboxRepository>,
    cloud: Arc<dyn CloudSyncClient>,
    notify: Arc<Notify>,
    cloud_api_url: Arc<dyn CloudSyncUrlProvider>,
    cloud_api_key: String,
) {
    let mut backoff = Duration::from_secs(1);

    loop {
        tokio::select! {
            _ = notify.notified() => {}
            _ = tokio::time::sleep(Duration::from_secs(30)) => {}
        }

        let batch = match outbox.find_pending(100).await {
            Ok(b) => b,
            Err(e) => {
                tracing::warn!(error = %e, "outbox find_pending failed");
                continue;
            }
        };

        if batch.is_empty() {
            backoff = Duration::from_secs(1);
            continue;
        }

        let entries: Vec<SyncEntry> = batch
            .iter()
            .map(|e| SyncEntry {
                id: e.id.clone(),
                entity_type: e.entity_type.clone(),
                entity_id: e.entity_id.clone(),
                operation: e.operation.clone(),
                payload: e.payload.clone(),
                created_at: e.created_at,
            })
            .collect();

        let access_url = cloud_api_url.get().await;
        match cloud.ingest(&access_url, &cloud_api_key, entries).await {
            Ok(()) => {
                let ids: Vec<String> = batch.iter().map(|e| e.id.clone()).collect();
                outbox.mark_sent(&ids).await.ok();
                tracing::info!(count = batch.len(), "outbox pushed to cloud");
                backoff = Duration::from_secs(1);
            }
            Err(e) => {
                tracing::warn!(
                    error = %e,
                    pending = batch.len(),
                    backoff_secs = backoff.as_secs(),
                    "outbox push failed, will retry"
                );
                tokio::time::sleep(backoff).await;
                backoff = (backoff * 2).min(Duration::from_secs(300));
            }
        }
    }
}