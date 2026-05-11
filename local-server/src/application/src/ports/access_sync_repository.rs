use async_trait::async_trait;

use local_server_core::DomainError;

use super::cloud_sync_client::{RemoteHouse, RemoteRoom};

/// Sync status read from the local DB.
#[derive(Debug, Clone)]
pub struct SyncStatus {
    pub pending_outbox: i64,
    pub last_pulled_at: Option<String>,
    pub last_pushed_at: Option<String>,
}

/// Inbound port — stores data pulled from access-service into local SQLite.
///
/// Implemented by `SqliteAccessSyncRepo` in the infrastructure crate.
#[async_trait]
pub trait AccessSyncRepository: Send + Sync {
    /// Ensure a minimal user record exists for the given external (Keycloak) UUID.
    async fn upsert_owner(&self, external_user_id: &str) -> Result<(), DomainError>;

    /// Bulk upsert houses. Removes houses that are no longer in the list.
    async fn upsert_houses(
        &self,
        houses: &[RemoteHouse],
        owner_external_id: &str,
    ) -> Result<(), DomainError>;

    /// Bulk upsert rooms for a house (as `resources` rows with type=ROOM).
    async fn upsert_rooms(
        &self,
        house_id: &str,
        rooms: &[RemoteRoom],
    ) -> Result<(), DomainError>;

    /// Record the timestamp of the last successful pull for an entity type
    /// (`"houses"`, `"rooms"`, …).
    async fn mark_pulled(&self, entity_type: &str, at: &str) -> Result<(), DomainError>;

    /// Aggregate sync status across all tracked entity types.
    async fn get_status(&self) -> Result<SyncStatus, DomainError>;

    /// List synced houses for a given owner's external user ID.
    async fn list_houses(&self, owner_external_id: &str) -> Result<Vec<RemoteHouse>, DomainError>;

    /// List synced rooms for a house.
    async fn list_rooms(&self, house_id: &str) -> Result<Vec<RemoteRoom>, DomainError>;
}
