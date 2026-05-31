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

/// Serialised over the wire as the `zigbee:pairing:event` payload.
/// Shape matches the frontend `PairingEvent` type.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PairingEventDto {
    /// Event type: device_joined, interview_started, interview_successful, interview_failed, device_leave
    #[serde(rename = "type")]
    pub event_type: String,
    pub ieee_addr: Option<String>,
    pub friendly_name: Option<String>,
    pub model: Option<String>,
    pub manufacturer_name: Option<String>,
    pub message: Option<String>,
    pub timestamp: String,
}

impl From<&PairingEvent> for PairingEventDto {
    fn from(e: &PairingEvent) -> Self {
        Self {
            event_type: e.event_type.clone(),
            ieee_addr: e.ieee_address.clone(),
            friendly_name: e.friendly_name.clone(),
            model: e.model.clone(),
            manufacturer_name: e.manufacturer_name.clone(),
            message: e.message.clone(),
            timestamp: e.timestamp.to_rfc3339(),
        }
    }
}

/// Serialised over the wire as the `zigbee:pairing:status` payload.
/// Matches what the frontend `usePairing` hook expects: `{ permitJoinEnabled: boolean }`.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermitJoinStatusDto {
    pub permit_join_enabled: bool,
}

// Keep old alias for any remaining references
pub type PairingStatusDto = PairingEventDto;

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
