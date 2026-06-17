use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use local_server_core::DomainError;

#[derive(Debug, Clone)]
pub struct RemoteHouse {
    pub id: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub plan_url: Option<String>,
    pub address: Option<String>,
    pub owner_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone)]
pub struct RemoteRoom {
    pub id: String,
    pub name: String,
    pub house_id: String,
    pub created_at: String,
}

#[derive(Debug, Clone)]
pub struct RemoteHouseMember {
    pub id: String,
    pub user_id: String,
    pub house_id: String,
    pub user_display_name: Option<String>,
    pub user_avatar_url: Option<String>,
    pub joined_at: String,
    pub role_ids: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct RemoteHouseRole {
    pub id: String,
    pub name: String,
    pub priority: i32,
    pub is_system: bool,
    pub house_id: String,
}

#[derive(Debug, Clone)]
pub struct RemoteResource {
    pub id: String,
    pub r#type: String,
    pub name: Option<String>,
    pub external_id: Option<String>,
    pub path: String,
    pub depth: i32,
    pub house_id: String,
    pub parent_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct RemoteAccessRight {
    pub id: String,
    pub resource_id: String,
    pub house_member_id: Option<String>,
    pub role_id: Option<String>,
    pub access_right_type: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct SyncPullReport {
    pub houses_upserted: usize,
    pub rooms_upserted: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncEntry {
    pub id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub operation: String,
    pub payload: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[async_trait]
pub trait CloudSyncClient: Send + Sync {
    async fn fetch_user_houses(
        &self,
        base_url: &str,
        user_id: &str,
    ) -> Result<Vec<RemoteHouse>, DomainError>;

    async fn fetch_house_rooms(
        &self,
        base_url: &str,
        house_id: &str,
    ) -> Result<Vec<RemoteRoom>, DomainError>;

    async fn fetch_house_members(
        &self,
        base_url: &str,
        house_id: &str,
    ) -> Result<Vec<RemoteHouseMember>, DomainError>;

    async fn fetch_house_roles(
        &self,
        base_url: &str,
        house_id: &str,
    ) -> Result<Vec<RemoteHouseRole>, DomainError>;

    async fn fetch_house_resources(
        &self,
        base_url: &str,
        house_id: &str,
    ) -> Result<Vec<RemoteResource>, DomainError>;

    async fn fetch_user_access_rights(
        &self,
        base_url: &str,
        user_id: &str,
    ) -> Result<Vec<RemoteAccessRight>, DomainError>;

    async fn ingest(
        &self,
        base_url: &str,
        api_key: &str,
        entries: Vec<SyncEntry>,
    ) -> Result<(), DomainError>;

    async fn delta(
        &self,
        base_url: &str,
        api_key: &str,
        since: DateTime<Utc>,
    ) -> Result<Vec<SyncEntry>, DomainError>;
}