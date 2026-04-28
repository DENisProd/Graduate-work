use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum DeviceStatus {
    Online,
    #[default]
    Offline,
}

impl DeviceStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            DeviceStatus::Online => "ONLINE",
            DeviceStatus::Offline => "OFFLINE",
        }
    }
}

impl std::str::FromStr for DeviceStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "ONLINE" => Ok(DeviceStatus::Online),
            "OFFLINE" => Ok(DeviceStatus::Offline),
            other => Err(format!("unknown status: {other}")),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FunctionType {
    Read,
    Write,
    ReadWrite,
}

impl FunctionType {
    pub fn as_str(self) -> &'static str {
        match self {
            FunctionType::Read => "READ",
            FunctionType::Write => "WRITE",
            FunctionType::ReadWrite => "READ_WRITE",
        }
    }
}

impl std::str::FromStr for FunctionType {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "READ" => Ok(FunctionType::Read),
            "WRITE" => Ok(FunctionType::Write),
            "READ_WRITE" => Ok(FunctionType::ReadWrite),
            other => Err(format!("unknown function type: {other}")),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ActionType {
    Toggle,
    Command,
    Value,
}

impl ActionType {
    pub fn as_str(self) -> &'static str {
        match self {
            ActionType::Toggle => "TOGGLE",
            ActionType::Command => "COMMAND",
            ActionType::Value => "VALUE",
        }
    }
}

impl std::str::FromStr for ActionType {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "TOGGLE" => Ok(ActionType::Toggle),
            "COMMAND" => Ok(ActionType::Command),
            "VALUE" => Ok(ActionType::Value),
            other => Err(format!("unknown action type: {other}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceType {
    pub id: i64,
    pub code: String,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceCategory {
    pub id: i64,
    pub code: String,
    pub device_type_id: i64,
    pub active: bool,
    pub is_moderated: bool,
}

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
    pub last_seen_at: Option<String>,
}

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceFunctionAction {
    pub id: i64,
    pub code: String,
    pub device_function_id: i64,
    pub action_type: ActionType,
    pub payload_template: Option<String>,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceFunctionDetailed {
    pub id: i64,
    pub code: String,
    pub device_id: i64,
    pub function_type: FunctionType,
    pub current_value: Option<String>,
    pub min_value: Option<String>,
    pub max_value: Option<String>,
    pub unit: Option<String>,
    pub active: bool,
    pub actions: Vec<DeviceFunctionAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceTranslation {
    pub locale: String,
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceDetailed {
    pub id: i64,
    pub code: String,
    pub device_category_id: i64,
    pub status: DeviceStatus,
    pub serial_number: Option<String>,
    pub firmware_version: Option<String>,
    pub active: bool,
    pub is_moderated: bool,
    pub last_seen_at: Option<String>,
    pub functions: Vec<DeviceFunctionDetailed>,
    pub translations: Vec<DeviceTranslation>,
}
