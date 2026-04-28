use serde::{Deserialize, Serialize};

/// Status of an abstract catalog device.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum DeviceStatus {
    Online,
    #[default]
    Offline,
}

/// `function_type` of a `device_function` (LS-002 will use this).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FunctionType {
    Read,
    Write,
    ReadWrite,
}

/// Catalog device aggregate (stub at LS-001).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Device {
    pub id: i64,
    pub code: String,
    pub device_category_id: i64,
    pub status: DeviceStatus,
    pub serial_number: Option<String>,
    pub firmware_version: Option<String>,
    pub active: bool,
    pub is_moderated: bool,
}

/// Catalog category (stub).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceCategory {
    pub id: i64,
    pub code: String,
    pub device_type_id: i64,
    pub active: bool,
    pub is_moderated: bool,
}

/// Function attached to a catalog device (stub).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceFunction {
    pub id: i64,
    pub code: String,
    pub device_id: i64,
    pub function_type: FunctionType,
    pub current_value: Option<String>,
    pub min_value: Option<String>,
    pub max_value: Option<String>,
    pub unit: Option<String>,
    pub active: bool,
}
