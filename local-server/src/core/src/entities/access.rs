use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ResourceType {
    House,
    Room,
    Device,
    DeviceFunction,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AccessRightType {
    Allow,
    Deny,
    Read,
    Write,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ConflictStrategy {
    DenyOverrides,
    AllowOverrides,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct House {
    pub id: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub address: Option<String>,
    pub conflict_strategy: ConflictStrategy,
    pub owner_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HouseMember {
    pub id: String,
    pub house_id: String,
    pub user_id: String,
    pub joined_at: DateTime<Utc>,
    pub removed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HouseRole {
    pub id: String,
    pub name: String,
    pub priority: i32,
    pub is_system: bool,
    pub house_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resource {
    pub id: String,
    pub r#type: ResourceType,
    pub external_id: Option<String>,
    pub path: String,
    pub depth: i32,
    pub house_id: String,
    pub parent_id: Option<String>,
}
