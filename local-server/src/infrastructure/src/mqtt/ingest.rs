use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use chrono::Utc;
use serde_json::Value;
use tokio::sync::broadcast;

use local_server_application::{
    ports::{PhysicalDeviceRepository, ZigbeeRepository},
    ports::physical_device_repository::UpsertFromBridgeCmd,
    services::ZigbeeRealtimeService,
};
use local_server_core::entities::zigbee::{PairingEvent, ZigbeeDeviceState, ZigbeeMetrics};

use super::client::MqttMessage;
use super::modbus_gateway::ModbusGateway;

/// Per-session state accumulated by the ingestion loop.
#[derive(Default)]
struct IngestState {
    /// Map friendly_name → ieee_address built from the `bridge/devices` retained topic.
    friendly_to_ieee: HashMap<String, String>,
    /// IEEE addresses for which telemetry has already been observed this session.
    /// Used to log a one-shot INFO when a device starts reporting.
    telemetry_seen: HashSet<String>,
    /// Set to true after the first `bridge/devices` snapshot has been processed
    /// so subsequent snapshots can detect newly added devices.
    bridge_snapshot_seen: bool,
}

/// Drive the MQTT ingestion loop until the message channel is closed.
///
/// Maintains an in-process map of friendly_name → ieee_address built from
/// the `bridge/devices` retained topic so that telemetry topics (which use
/// friendly names) can be keyed by IEEE address in the database.
pub async fn run_ingestion(
    mut rx: broadcast::Receiver<MqttMessage>,
    zigbee_repo: Arc<dyn ZigbeeRepository>,
    phys_repo: Arc<dyn PhysicalDeviceRepository>,
    realtime_svc: Arc<ZigbeeRealtimeService>,
    prefix: String,
    modbus_gateway: Option<Arc<ModbusGateway>>,
) {
    tracing::info!(prefix = %prefix, "MQTT ingestion started");
    let mut state = IngestState::default();
    loop {
        match rx.recv().await {
            Ok(msg) => {
                // Route modbus responses before the zigbee prefix check.
                if msg.topic == "modbus/response" {
                    tracing::info!(
                        bytes = msg.payload.len(),
                        "modbus: ingest received modbus/response",
                    );
                    if let Some(gw) = &modbus_gateway {
                        gw.on_response(&msg.payload);
                    } else {
                        tracing::warn!("modbus: received modbus/response but gateway is None");
                    }
                    continue;
                }
                handle_message(
                    &msg,
                    &zigbee_repo,
                    &phys_repo,
                    &realtime_svc,
                    &prefix,
                    &mut state,
                )
                .await
            }
            Err(broadcast::error::RecvError::Lagged(n)) => {
                tracing::warn!(dropped = n, "MQTT ingestion lagged, messages dropped");
            }
            Err(broadcast::error::RecvError::Closed) => {
                tracing::info!("MQTT channel closed, stopping ingestion");
                break;
            }
        }
    }
}

async fn handle_message(
    msg: &MqttMessage,
    zigbee_repo: &Arc<dyn ZigbeeRepository>,
    phys_repo: &Arc<dyn PhysicalDeviceRepository>,
    svc: &Arc<ZigbeeRealtimeService>,
    prefix: &str,
    state: &mut IngestState,
) {
    let Some(suffix) = msg.topic.strip_prefix(prefix) else { return };
    let suffix = suffix.trim_start_matches('/');

    match suffix {
        "bridge/devices" => handle_bridge_devices(&msg.payload, phys_repo, state).await,
        "bridge/event" => handle_bridge_event(&msg.payload, svc).await,
        "bridge/state" => handle_bridge_state(&msg.payload, svc).await,
        s if s.starts_with("bridge/") => {}
        device if !device.is_empty() && !device.contains('/') => {
            handle_device_telemetry(
                device,
                &msg.payload,
                zigbee_repo,
                phys_repo,
                svc,
                state,
            )
            .await;
        }
        _ => {}
    }
}

/// Parse the Zigbee2MQTT `bridge/devices` JSON array and upsert each device.
async fn handle_bridge_devices(
    payload: &[u8],
    phys_repo: &Arc<dyn PhysicalDeviceRepository>,
    state: &mut IngestState,
) {
    let devices: Vec<Value> = match serde_json::from_slice(payload) {
        Ok(Value::Array(arr)) => arr,
        _ => return,
    };

    let mut new_in_session = 0usize;
    let mut new_in_db = 0usize;

    for dev in &devices {
        let ieee = match dev["ieee_address"].as_str() {
            Some(s) => s.to_owned(),
            None => continue,
        };
        let friendly = dev["friendly_name"]
            .as_str()
            .unwrap_or(&ieee)
            .to_owned();

        let is_new_in_session = !state.friendly_to_ieee.contains_key(&friendly);
        state
            .friendly_to_ieee
            .insert(friendly.clone(), ieee.clone());
        if is_new_in_session {
            new_in_session += 1;
        }

        let definition = if dev["definition"].is_null() || !dev["definition"].is_object() {
            None
        } else {
            Some(dev["definition"].clone())
        };

        let model = dev["model_id"]
            .as_str()
            .or_else(|| dev["definition"]["model"].as_str())
            .map(str::to_owned);

        let manufacturer = dev["manufacturer"]
            .as_str()
            .or_else(|| dev["definition"]["vendor"].as_str())
            .map(str::to_owned);

        let interview_completed = dev["interview_completed"].as_bool().unwrap_or(false);

        let existed_before = phys_repo
            .find_by_ieee(&ieee)
            .await
            .ok()
            .flatten()
            .is_some();
        if !existed_before {
            new_in_db += 1;
            tracing::info!(
                ieee = %ieee,
                friendly = %friendly,
                model = model.as_deref().unwrap_or("?"),
                vendor = manufacturer.as_deref().unwrap_or("?"),
                interview_completed,
                "Zigbee device connected (first time seen, added to DB)"
            );
        } else if is_new_in_session && state.bridge_snapshot_seen {
            tracing::info!(
                ieee = %ieee,
                friendly = %friendly,
                model = model.as_deref().unwrap_or("?"),
                vendor = manufacturer.as_deref().unwrap_or("?"),
                interview_completed,
                "Zigbee device reappeared in bridge/devices snapshot"
            );
        }

        let cmd = UpsertFromBridgeCmd {
            ieee_address: ieee.clone(),
            friendly_name: Some(friendly),
            device_type: dev["type"].as_str().map(str::to_owned),
            network_address: dev["network_address"].as_i64(),
            manufacturer_name: manufacturer,
            model,
            firmware_version: dev["software_build_id"].as_str().map(str::to_owned),
            power_source: dev["power_source"].as_str().map(str::to_owned),
            interview_completed,
            definition,
        };

        if let Err(e) = phys_repo.upsert_by_ieee(cmd).await {
            tracing::warn!(ieee = %ieee, error = %e, "failed to upsert device from bridge/devices");
        }
    }

    if !state.bridge_snapshot_seen {
        tracing::info!(
            total = devices.len(),
            new_in_db = new_in_db,
            "bridge/devices: initial snapshot received, paired devices loaded"
        );
        state.bridge_snapshot_seen = true;
    } else if new_in_session > 0 || new_in_db > 0 {
        tracing::info!(
            total = devices.len(),
            new_in_session = new_in_session,
            new_in_db = new_in_db,
            "bridge/devices: snapshot updated"
        );
    } else {
        tracing::debug!(count = devices.len(), "bridge/devices: synced devices");
    }
}

async fn handle_bridge_event(payload: &[u8], svc: &Arc<ZigbeeRealtimeService>) {
    let v: Value = match serde_json::from_slice(payload) {
        Ok(v) => v,
        Err(_) => return,
    };

    let event_type = match v["type"].as_str() {
        Some(t) => t,
        None => return,
    };

    let data = &v["data"];
    let ieee = data["ieee_address"].as_str().map(str::to_owned);
    let friendly = data["friendly_name"].as_str().map(str::to_owned);

    let pairing_event_type = match event_type {
        "device_joined" => Some("device_joined"),
        "device_announce" => Some("device_joined"),
        "device_leave" => Some("device_leave"),
        "device_interview" => {
            match data["status"].as_str() {
                Some("interview_started") => Some("interview_started"),
                Some("interview_successful") | Some("interview_done") => Some("interview_successful"),
                Some("interview_failed") => Some("interview_failed"),
                _ => None,
            }
        }
        _ => None,
    };

    if let Some(evt_type) = pairing_event_type {
        let model = data["definition"]["model"]
            .as_str()
            .or_else(|| data["model_id"].as_str())
            .map(str::to_owned);
        let manufacturer = data["definition"]["vendor"]
            .as_str()
            .or_else(|| data["manufacturer"].as_str())
            .map(str::to_owned);
        let message = data["error"].as_str().map(str::to_owned);

        let log_ieee = ieee.as_deref().unwrap_or("?");
        let log_friendly = friendly.as_deref().unwrap_or("?");
        let log_model = model.as_deref().unwrap_or("?");
        let log_vendor = manufacturer.as_deref().unwrap_or("?");
        match evt_type {
            "device_joined" => tracing::info!(
                ieee = %log_ieee,
                friendly = %log_friendly,
                model = %log_model,
                vendor = %log_vendor,
                "Zigbee device joined network"
            ),
            "interview_started" => tracing::info!(
                ieee = %log_ieee,
                friendly = %log_friendly,
                "Zigbee device interview started"
            ),
            "interview_successful" => tracing::info!(
                ieee = %log_ieee,
                friendly = %log_friendly,
                model = %log_model,
                vendor = %log_vendor,
                "Zigbee device interview successful (device ready)"
            ),
            "interview_failed" => tracing::warn!(
                ieee = %log_ieee,
                friendly = %log_friendly,
                error = message.as_deref().unwrap_or(""),
                "Zigbee device interview failed"
            ),
            "device_leave" => tracing::info!(
                ieee = %log_ieee,
                friendly = %log_friendly,
                "Zigbee device left network"
            ),
            _ => {}
        }

        svc.publish_pairing(PairingEvent {
            event_type: evt_type.to_owned(),
            ieee_address: ieee,
            friendly_name: friendly,
            model,
            manufacturer_name: manufacturer,
            message,
            timestamp: Utc::now(),
        });
    }
}

/// Parse `bridge/state` and emit permit_join status.
async fn handle_bridge_state(payload: &[u8], svc: &Arc<ZigbeeRealtimeService>) {
    let v: Value = match serde_json::from_slice(payload) {
        Ok(v) => v,
        Err(_) => return,
    };
    if let Some(enabled) = v["permit_join"].as_bool() {
        tracing::info!(
            permit_join = enabled,
            "Zigbee bridge state: permit_join {}",
            if enabled { "enabled (pairing mode ON)" } else { "disabled" }
        );
        svc.publish_permit_join(enabled);
    }
}

async fn handle_device_telemetry(
    friendly_name: &str,
    payload: &[u8],
    zigbee_repo: &Arc<dyn ZigbeeRepository>,
    phys_repo: &Arc<dyn PhysicalDeviceRepository>,
    svc: &Arc<ZigbeeRealtimeService>,
    state: &mut IngestState,
) {
    let raw: Value = match serde_json::from_slice(payload) {
        Ok(v) => v,
        Err(e) => {
            tracing::debug!(device = friendly_name, error = %e, "non-JSON zigbee payload");
            return;
        }
    };

    // Resolve IEEE address: prefer the mapping built from bridge/devices,
    // fall back to the friendly_name itself (which may already be an IEEE addr).
    let ieee_addr = state
        .friendly_to_ieee
        .get(friendly_name)
        .cloned()
        .unwrap_or_else(|| friendly_name.to_owned());

    if state.telemetry_seen.insert(ieee_addr.clone()) {
        tracing::info!(
            ieee = %ieee_addr,
            friendly = %friendly_name,
            "Zigbee device started reporting telemetry"
        );
    }

    let metrics = normalize_payload(&raw);
    let device_state = ZigbeeDeviceState {
        device_ieee_addr: ieee_addr.clone(),
        timestamp: Utc::now(),
        payload: raw,
        state: metrics.state.clone(),
        brightness: metrics.brightness,
        linkquality: metrics.linkquality,
        color_mode: metrics.color_mode.clone(),
        occupancy: metrics.occupancy,
        temperature: metrics.temperature,
        humidity: metrics.humidity,
        battery: metrics.battery,
    };

    if let Err(e) = zigbee_repo.insert_state(&device_state).await {
        tracing::warn!(device = friendly_name, error = %e, "failed to persist zigbee state");
    }

    // Touch last_seen on the physical device (best-effort)
    phys_repo.update_last_seen(&ieee_addr).await.ok();

    svc.publish_state(device_state);
}

fn normalize_payload(v: &Value) -> ZigbeeMetrics {
    ZigbeeMetrics {
        state: parse_state(v),
        brightness: v["brightness"].as_i64(),
        temperature: v["temperature"].as_f64(),
        humidity: v["humidity"].as_f64(),
        battery: v["battery"].as_f64(),
        occupancy: parse_bool(v, &["occupancy", "motion"]),
        linkquality: v["linkquality"].as_i64(),
        color_mode: v["color_mode"]
            .as_str()
            .or_else(|| v["colorMode"].as_str())
            .map(str::to_owned),
    }
}

fn parse_state(v: &Value) -> Option<String> {
    match &v["state"] {
        Value::String(s) => Some(s.to_uppercase()),
        Value::Bool(b) => Some(if *b { "ON" } else { "OFF" }.to_owned()),
        Value::Number(n) => {
            if n.as_i64() == Some(1) { Some("ON".to_owned()) }
            else if n.as_i64() == Some(0) { Some("OFF".to_owned()) }
            else { None }
        }
        _ => None,
    }
}

fn parse_bool(v: &Value, keys: &[&str]) -> Option<bool> {
    for key in keys {
        let field = &v[key];
        match field {
            Value::Bool(b) => return Some(*b),
            Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    return Some(i != 0);
                }
            }
            Value::String(s) => {
                let lower = s.to_lowercase();
                if matches!(lower.as_str(), "true" | "yes" | "on" | "1") {
                    return Some(true);
                } else if matches!(lower.as_str(), "false" | "no" | "off" | "0") {
                    return Some(false);
                }
            }
            _ => {}
        }
    }
    None
}
