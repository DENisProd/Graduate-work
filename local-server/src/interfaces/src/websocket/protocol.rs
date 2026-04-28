use serde::{Deserialize, Serialize};

use local_server_core::entities::zigbee::{PairingEvent, ZigbeeDeviceState};

// ─── Outbound events (server → client) ───────────────────────────────────────

/// Serialised over the wire as the `zigbee:state` event payload.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZigbeeStateDto {
    pub device_ieee_addr: String,
    pub timestamp: String,
    pub state: Option<String>,
    pub brightness: Option<i64>,
    pub temperature: Option<f64>,
    pub humidity: Option<f64>,
    pub battery: Option<f64>,
    pub occupancy: Option<bool>,
    pub linkquality: Option<i64>,
    pub color_mode: Option<String>,
}

impl From<&ZigbeeDeviceState> for ZigbeeStateDto {
    fn from(s: &ZigbeeDeviceState) -> Self {
        Self {
            device_ieee_addr: s.device_ieee_addr.clone(),
            timestamp: s.timestamp.to_rfc3339(),
            state: s.state.clone(),
            brightness: s.brightness,
            temperature: s.temperature,
            humidity: s.humidity,
            battery: s.battery,
            occupancy: s.occupancy,
            linkquality: s.linkquality,
            color_mode: s.color_mode.clone(),
        }
    }
}

impl From<ZigbeeDeviceState> for ZigbeeStateDto {
    fn from(s: ZigbeeDeviceState) -> Self {
        ZigbeeStateDto::from(&s)
    }
}

/// Serialised over the wire as the `zigbee:pairing:status` event payload.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PairingStatusDto {
    pub event_type: String,
    pub ieee_address: Option<String>,
    pub friendly_name: Option<String>,
    pub timestamp: String,
}

impl From<&PairingEvent> for PairingStatusDto {
    fn from(e: &PairingEvent) -> Self {
        Self {
            event_type: e.event_type.clone(),
            ieee_address: e.ieee_address.clone(),
            friendly_name: e.friendly_name.clone(),
            timestamp: e.timestamp.to_rfc3339(),
        }
    }
}

// ─── Inbound payloads (client → server) ──────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubscribePayload {
    pub device_ieee_addrs: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandPayload {
    /// Zigbee2MQTT friendly name (or IEEE address) of the target device.
    pub friendly_name: String,
    /// Arbitrary key/value map sent as the MQTT `set` payload.
    pub payload: serde_json::Value,
}
