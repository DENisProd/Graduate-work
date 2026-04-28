use std::sync::Arc;

use chrono::Utc;
use serde_json::Value;
use tokio::sync::broadcast;

use local_server_application::{
    ports::ZigbeeRepository,
    services::ZigbeeRealtimeService,
};
use local_server_core::entities::zigbee::{PairingEvent, ZigbeeDeviceState, ZigbeeMetrics};

use super::client::MqttMessage;

/// Drive the MQTT ingestion loop until the message channel is closed.
///
/// Runs as a background task (`tokio::spawn`). Receives raw MQTT messages,
/// routes by topic suffix, persists state, and broadcasts to real-time clients.
pub async fn run_ingestion(
    mut rx: broadcast::Receiver<MqttMessage>,
    zigbee_repo: Arc<dyn ZigbeeRepository>,
    realtime_svc: Arc<ZigbeeRealtimeService>,
    prefix: String,
) {
    tracing::info!(prefix = %prefix, "MQTT ingestion started");
    loop {
        match rx.recv().await {
            Ok(msg) => handle_message(&msg, &zigbee_repo, &realtime_svc, &prefix).await,
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
    repo: &Arc<dyn ZigbeeRepository>,
    svc: &Arc<ZigbeeRealtimeService>,
    prefix: &str,
) {
    let Some(suffix) = msg.topic.strip_prefix(prefix) else { return };
    let suffix = suffix.trim_start_matches('/');

    match suffix {
        "bridge/event" => handle_bridge_event(&msg.payload, svc).await,
        s if s.starts_with("bridge/") || s.starts_with("bridge") => {}
        device if !device.is_empty() && !device.contains('/') => {
            handle_device_telemetry(device, &msg.payload, repo, svc).await;
        }
        _ => {}
    }
}

async fn handle_device_telemetry(
    friendly_name: &str,
    payload: &[u8],
    repo: &Arc<dyn ZigbeeRepository>,
    svc: &Arc<ZigbeeRealtimeService>,
) {
    let raw: Value = match serde_json::from_slice(payload) {
        Ok(v) => v,
        Err(e) => {
            tracing::debug!(device = friendly_name, error = %e, "non-JSON zigbee payload");
            return;
        }
    };

    let metrics = normalize_payload(&raw);
    let state = ZigbeeDeviceState {
        device_ieee_addr: friendly_name.to_owned(),
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

    if let Err(e) = repo.insert_state(&state).await {
        tracing::warn!(device = friendly_name, error = %e, "failed to persist zigbee state");
    }

    svc.publish_state(state);
}

async fn handle_bridge_event(payload: &[u8], svc: &Arc<ZigbeeRealtimeService>) {
    let v: Value = match serde_json::from_slice(payload) {
        Ok(v) => v,
        Err(_) => return,
    };

    let event_type = match v["type"].as_str() {
        Some(t) => t.to_owned(),
        None => return,
    };

    match event_type.as_str() {
        "device_joined" | "device_announce" | "device_leave" => {
            let event = PairingEvent {
                event_type,
                ieee_address: v["data"]["ieee_address"].as_str().map(str::to_owned),
                friendly_name: v["data"]["friendly_name"].as_str().map(str::to_owned),
                timestamp: Utc::now(),
            };
            svc.publish_pairing(event);
        }
        _ => {}
    }
}

fn normalize_payload(v: &Value) -> ZigbeeMetrics {
    ZigbeeMetrics {
        state: v["state"].as_str().map(str::to_owned),
        brightness: v["brightness"].as_i64(),
        temperature: v["temperature"].as_f64(),
        humidity: v["humidity"].as_f64(),
        battery: v["battery"].as_f64(),
        occupancy: v["occupancy"].as_bool().or_else(|| v["motion"].as_bool()),
        linkquality: v["linkquality"].as_i64(),
        color_mode: v["color_mode"].as_str().map(str::to_owned),
    }
}
