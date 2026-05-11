use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use local_server_core::DomainError;

/// A house record fetched from access-service.
#[derive(Debug, Clone)]
pub struct RemoteHouse {
    pub id: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub address: Option<String>,
    pub owner_id: String,
    pub created_at: String,
    pub updated_at: String,
}

/// A room record fetched from access-service.
#[derive(Debug, Clone)]
pub struct RemoteRoom {
    pub id: String,
    pub name: String,
    pub house_id: String,
    pub created_at: String,
}

/// Result of a full pull sync cycle.
#[derive(Debug, Clone, Default)]
pub struct SyncPullReport {
    pub houses_upserted: usize,
    pub rooms_upserted: usize,
}

/// A single record to push/receive during outbox sync.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncEntry {
    pub id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub operation: String,
    pub payload: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

/// Outbound port — fetches reference data from the cloud access-service
/// and pushes outbox entries to the cloud sync endpoint.
///
/// Implemented by `ReqwestCloudSyncClient` in the infrastructure crate.
#[async_trait]
pub trait CloudSyncClient: Send + Sync {
    /// Fetch all houses the given user is a member of or owns.
    async fn fetch_user_houses(
        &self,
        base_url: &str,
        user_id: &str,
    ) -> Result<Vec<RemoteHouse>, DomainError>;

    /// Fetch all rooms belonging to a house.
    async fn fetch_house_rooms(
        &self,
        base_url: &str,
        house_id: &str,
    ) -> Result<Vec<RemoteRoom>, DomainError>;

    /// Push a batch of local mutations to the cloud ingest endpoint.
    async fn ingest(
        &self,
        base_url: &str,
        api_key: &str,
        entries: Vec<SyncEntry>,
    ) -> Result<(), DomainError>;

    /// Pull incremental changes since a given timestamp.
    async fn delta(
        &self,
        base_url: &str,
        api_key: &str,
        since: DateTime<Utc>,
    ) -> Result<Vec<SyncEntry>, DomainError>;
}
