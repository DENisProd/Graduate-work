use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZigbeeDeviceState {
    pub device_ieee_addr: String,
    pub timestamp: DateTime<Utc>,
    pub payload: serde_json::Value,
    pub state: Option<String>,
    pub brightness: Option<i64>,
    pub linkquality: Option<i64>,
    pub color_mode: Option<String>,
    pub occupancy: Option<bool>,
    pub temperature: Option<f64>,
    pub humidity: Option<f64>,
    pub battery: Option<f64>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ZigbeeMetrics {
    pub link_quality: Option<i64>,
    pub rssi: Option<f64>,
    pub lqi: Option<i64>,
    pub battery: Option<f64>,
}
