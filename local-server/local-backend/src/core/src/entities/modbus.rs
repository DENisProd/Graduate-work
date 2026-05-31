use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModbusDevice {
    pub id: Uuid,
    pub name: String,
    pub slave_id: i64,
    pub description: Option<String>,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RegisterType {
    Holding,
    Input,
    Coil,
    Discrete,
}

impl RegisterType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Holding  => "holding",
            Self::Input    => "input",
            Self::Coil     => "coil",
            Self::Discrete => "discrete",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "holding"  => Some(Self::Holding),
            "input"    => Some(Self::Input),
            "coil"     => Some(Self::Coil),
            "discrete" => Some(Self::Discrete),
            _          => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModbusRegister {
    pub id: Uuid,
    pub device_id: Uuid,
    pub name: String,
    pub register_type: RegisterType,
    pub address: i64,
    pub count: i64,
    pub unit: Option<String>,
    pub scale_factor: f64,
    pub offset: f64,
    pub writable: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModbusRegisterState {
    pub register_id: Uuid,
    pub raw_values: Vec<serde_json::Value>,
    pub scaled_values: Vec<f64>,
    pub timestamp: DateTime<Utc>,
}
