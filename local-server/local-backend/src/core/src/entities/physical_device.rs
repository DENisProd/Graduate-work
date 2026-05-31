use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum PhysicalDeviceType {
    Coordinator,
    Router,
    EndDevice,
}

impl PhysicalDeviceType {
    pub fn as_str(self) -> &'static str {
        match self {
            PhysicalDeviceType::Coordinator => "Coordinator",
            PhysicalDeviceType::Router => "Router",
            PhysicalDeviceType::EndDevice => "EndDevice",
        }
    }
}

impl std::str::FromStr for PhysicalDeviceType {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Coordinator" => Ok(PhysicalDeviceType::Coordinator),
            "Router" => Ok(PhysicalDeviceType::Router),
            "EndDevice" => Ok(PhysicalDeviceType::EndDevice),
            other => Err(format!("unknown physical device type: {other}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhysicalDevice {
    pub id: Uuid,
    pub name: Option<String>,
    pub description: Option<String>,
    pub house_id: Option<String>,
    pub room_id: Option<String>,
    pub device_id: Option<i64>,
    pub device_category_id: Option<i64>,
    pub protocol_address: Option<String>,
    pub network_address: Option<i64>,
    pub r#type: Option<PhysicalDeviceType>,
    pub manufacturer_name: Option<String>,
    pub model: Option<String>,
    pub friendly_name: Option<String>,
    pub firmware_version: Option<String>,
    pub power_source: Option<String>,
    pub interview_completed: bool,
    pub definition: Option<serde_json::Value>,
    pub last_seen: Option<DateTime<Utc>>,
    pub cloud_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
