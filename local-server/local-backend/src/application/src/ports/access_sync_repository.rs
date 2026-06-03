use async_trait::async_trait;

use local_server_core::DomainError;

use super::cloud_sync_client::{
    RemoteAccessRight, RemoteHouse, RemoteHouseMember, RemoteHouseRole, RemoteResource, RemoteRoom,
};

#[derive(Debug, Clone)]
pub struct SyncStatus {
    pub pending_outbox: i64,
    pub last_pulled_at: Option<String>,
    pub last_pushed_at: Option<String>,
}

#[async_trait]
pub trait AccessSyncRepository: Send + Sync {
    async fn upsert_owner(&self, external_user_id: &str) -> Result<(), DomainError>;

    async fn upsert_houses(
        &self,
        houses: &[RemoteHouse],
        owner_external_id: &str,
    ) -> Result<(), DomainError>;

    async fn upsert_rooms(
        &self,
        house_id: &str,
        rooms: &[RemoteRoom],
    ) -> Result<(), DomainError>;

    async fn mark_pulled(&self, entity_type: &str, at: &str) -> Result<(), DomainError>;

    async fn get_status(&self) -> Result<SyncStatus, DomainError>;

    async fn list_houses(&self, owner_external_id: &str) -> Result<Vec<RemoteHouse>, DomainError>;

    async fn list_rooms(&self, house_id: &str) -> Result<Vec<RemoteRoom>, DomainError>;

    async fn upsert_members(
        &self,
        house_id: &str,
        members: &[RemoteHouseMember],
    ) -> Result<(), DomainError>;

    async fn upsert_rbac_roles(
        &self,
        house_id: &str,
        roles: &[RemoteHouseRole],
    ) -> Result<(), DomainError>;

    async fn upsert_rbac_members(
        &self,
        house_id: &str,
        members: &[RemoteHouseMember],
    ) -> Result<(), DomainError>;

    async fn upsert_resources(
        &self,
        house_id: &str,
        resources: &[RemoteResource],
    ) -> Result<(), DomainError>;

    async fn upsert_access_rights(
        &self,
        user_external_id: &str,
        rights: &[RemoteAccessRight],
    ) -> Result<(), DomainError>;
}