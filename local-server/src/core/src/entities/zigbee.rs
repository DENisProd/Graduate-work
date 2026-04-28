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

/// Normalized metrics extracted from a Zigbee2MQTT telemetry payload.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ZigbeeMetrics {
    pub state: Option<String>,
    pub brightness: Option<i64>,
    pub temperature: Option<f64>,
    pub humidity: Option<f64>,
    pub battery: Option<f64>,
    pub occupancy: Option<bool>,
    pub linkquality: Option<i64>,
    pub color_mode: Option<String>,
}

/// Pairing event emitted from the Zigbee2MQTT bridge when a device joins or leaves.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairingEvent {
    pub event_type: String,
    pub ieee_address: Option<String>,
    pub friendly_name: Option<String>,
    pub timestamp: DateTime<Utc>,
}
