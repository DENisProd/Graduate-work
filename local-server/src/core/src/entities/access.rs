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

impl ResourceType {
    pub fn as_str(self) -> &'static str {
        match self {
            ResourceType::House => "HOUSE",
            ResourceType::Room => "ROOM",
            ResourceType::Device => "DEVICE",
            ResourceType::DeviceFunction => "DEVICE_FUNCTION",
        }
    }
}

impl std::str::FromStr for ResourceType {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "HOUSE" => Ok(ResourceType::House),
            "ROOM" => Ok(ResourceType::Room),
            "DEVICE" => Ok(ResourceType::Device),
            "DEVICE_FUNCTION" => Ok(ResourceType::DeviceFunction),
            other => Err(format!("unknown resource type: {other}")),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AccessRightType {
    Allow,
    Deny,
    Read,
    Write,
}

impl AccessRightType {
    pub fn as_str(self) -> &'static str {
        match self {
            AccessRightType::Allow => "ALLOW",
            AccessRightType::Deny => "DENY",
            AccessRightType::Read => "READ",
            AccessRightType::Write => "WRITE",
        }
    }

    pub fn is_permissive(self) -> bool {
        matches!(self, AccessRightType::Allow | AccessRightType::Read | AccessRightType::Write)
    }
}

impl std::str::FromStr for AccessRightType {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "ALLOW" => Ok(AccessRightType::Allow),
            "DENY" => Ok(AccessRightType::Deny),
            "READ" => Ok(AccessRightType::Read),
            "WRITE" => Ok(AccessRightType::Write),
            other => Err(format!("unknown right type: {other}")),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ConflictStrategy {
    DenyOverrides,
    AllowOverrides,
}

impl ConflictStrategy {
    pub fn as_str(self) -> &'static str {
        match self {
            ConflictStrategy::DenyOverrides => "DENY_OVERRIDES",
            ConflictStrategy::AllowOverrides => "ALLOW_OVERRIDES",
        }
    }
}

impl std::str::FromStr for ConflictStrategy {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "DENY_OVERRIDES" => Ok(ConflictStrategy::DenyOverrides),
            "ALLOW_OVERRIDES" => Ok(ConflictStrategy::AllowOverrides),
            other => Err(format!("unknown conflict strategy: {other}")),
        }
    }
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
    /// Cloud-side user identifier — populated when joined with the users table.
    pub external_user_id: Option<String>,
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
pub struct HouseRoom {
    pub id: String,
    pub name: String,
    pub house_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HouseInvitation {
    pub id: String,
    pub house_id: String,
    pub email: String,
    pub token_hash: String,
    pub status: String,
    pub role_id: Option<String>,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resource {
    pub id: String,
    pub r#type: ResourceType,
    pub name: Option<String>,
    pub external_id: Option<String>,
    pub path: String,
    pub depth: i32,
    pub house_id: String,
    pub parent_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessRight {
    pub id: String,
    pub access_right_type: AccessRightType,
    pub parameters: Option<String>,
    pub resource_id: String,
    pub house_member_id: String,
    pub role_id: Option<String>,
    pub granted_by_id: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessPolicy {
    pub id: String,
    pub name: String,
    pub effect: String,
    pub subject_type: String,
    pub subject_id: Option<String>,
    pub condition: Option<serde_json::Value>,
    pub priority: i32,
    pub house_id: String,
    pub resource_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EffectivePermission {
    pub id: String,
    pub access_right_type: AccessRightType,
    pub source_type: String,
    pub source_id: String,
    pub house_member_id: String,
    pub resource_id: String,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessCheckResult {
    pub has_access: bool,
    pub effective_right_type: Option<String>,
    pub reason: String,
}
