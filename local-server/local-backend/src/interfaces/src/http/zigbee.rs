use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use local_server_core::entities::physical_device::PhysicalDevice;
use serde::{Deserialize, Serialize};

use local_server_application::{
    ports::{MqttClient, PhysicalDeviceRepository, ZigbeeRepository},
    DomainError,
};

use super::error::AppError;
use crate::websocket::protocol::{CommandPayload, ZigbeeStateDto};

#[derive(Clone)]
pub struct ZigbeeHttpState {
    pub zigbee_repo: Arc<dyn ZigbeeRepository>,
    pub phys_repo: Arc<dyn PhysicalDeviceRepository>,
    pub mqtt: Arc<dyn MqttClient>,
    pub prefix: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZigbeeDeviceResponse {
    pub id: String,
    pub ieee_addr: String,
    pub network_addr: Option<i64>,
    pub friendly_name: Option<String>,
    pub model: Option<String>,
    pub manufacturer_name: Option<String>,
    pub r#type: String,
    pub firmware_version: Option<String>,
    pub power_source: Option<String>,
    pub interview_completed: bool,
    pub last_seen: Option<String>,
    pub definition: Option<serde_json::Value>,
}

impl From<&PhysicalDevice> for ZigbeeDeviceResponse {
    fn from(d: &PhysicalDevice) -> Self {
        let device_type = d
            .r#type
            .map(|t| t.as_str().to_owned())
            .unwrap_or_else(|| "EndDevice".to_owned());
        Self {
            id: d.id.to_string(),
            ieee_addr: d.protocol_address.clone().unwrap_or_default(),
            network_addr: d.network_address,
            friendly_name: d.friendly_name.clone(),
            model: d.model.clone(),
            manufacturer_name: d.manufacturer_name.clone(),
            r#type: device_type,
            firmware_version: d.firmware_version.clone(),
            power_source: d.power_source.clone(),
            interview_completed: d.interview_completed,
            last_seen: d.last_seen.map(|t| t.to_rfc3339()),
            definition: d.definition.clone(),
        }
    }
}

pub fn router(
    zigbee_repo: Arc<dyn ZigbeeRepository>,
    phys_repo: Arc<dyn PhysicalDeviceRepository>,
    mqtt: Arc<dyn MqttClient>,
    prefix: String,
) -> Router {
    let state = ZigbeeHttpState { zigbee_repo, phys_repo, mqtt, prefix };
    Router::new()
        .route("/zigbee/devices", get(list_devices))
        .route("/zigbee/devices/sync-from-bridge", post(sync_from_bridge))
        .route("/zigbee/devices/:ieee", get(get_device).delete(delete_device))
        .route("/zigbee/devices/:ieee/command", post(send_command))
        .route("/zigbee/permit-join", post(permit_join))
        .route("/zigbee/states", get(list_states))
        .route("/zigbee/device-logs", get(list_logs))
        .with_state(state)
}

async fn list_devices(
    State(s): State<ZigbeeHttpState>,
) -> Result<Json<Vec<ZigbeeDeviceResponse>>, AppError> {
    let devices = s.phys_repo.list_zigbee_devices().await?;
    Ok(Json(devices.iter().map(ZigbeeDeviceResponse::from).collect()))
}

async fn get_device(
    State(s): State<ZigbeeHttpState>,
    Path(ieee): Path<String>,
) -> Result<Json<ZigbeeDeviceResponse>, AppError> {
    let device = s
        .phys_repo
        .find_by_ieee(&ieee)
        .await?
        .ok_or_else(|| DomainError::not_found("zigbee_device", &ieee))?;
    Ok(Json(ZigbeeDeviceResponse::from(&device)))
}

async fn sync_from_bridge(
    State(s): State<ZigbeeHttpState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let topic = format!("{}/bridge/request/devices", s.prefix);
    s.mqtt.publish(&topic, b"").await.ok();
    Ok(Json(serde_json::json!({})))
}

async fn delete_device(
    State(s): State<ZigbeeHttpState>,
    Path(ieee): Path<String>,
) -> Result<StatusCode, AppError> {
    let topic = format!("{}/bridge/request/device/remove", s.prefix);
    let payload = serde_json::json!({ "id": ieee, "force": false });
    if let Ok(bytes) = serde_json::to_vec(&payload) {
        s.mqtt.publish(&topic, &bytes).await.ok();
    }
    s.phys_repo.delete_by_ieee(&ieee).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn send_command(
    State(s): State<ZigbeeHttpState>,
    Path(_ieee): Path<String>,
    Json(body): Json<CommandPayload>,
) -> Result<StatusCode, AppError> {
    let topic = format!("{}/{}/set", s.prefix, body.friendly_name);
    let payload = serde_json::to_vec(&body.payload)
        .map_err(|e| DomainError::Validation(e.to_string()))?;
    s.mqtt.publish(&topic, &payload).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn permit_join(
    State(s): State<ZigbeeHttpState>,
) -> Result<StatusCode, AppError> {
    let topic = format!("{}/bridge/request/permit_join", s.prefix);
    s.mqtt.publish(&topic, br#"{"value":true,"time":254}"#).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StatesQuery {
    ieee_addr: Option<String>,
    #[serde(default = "default_limit")]
    limit: i64,
}

fn default_limit() -> i64 { 100 }

async fn list_states(
    State(s): State<ZigbeeHttpState>,
    Query(q): Query<StatesQuery>,
) -> Result<Json<Vec<ZigbeeStateDto>>, AppError> {
    let states = s
        .zigbee_repo
        .list_states_filtered(q.ieee_addr.as_deref(), q.limit)
        .await?;
    Ok(Json(states.iter().map(ZigbeeStateDto::from).collect()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LogsQuery {
    ieee_addr: Option<String>,
    from: Option<String>,
    to: Option<String>,
    #[serde(default = "default_limit")]
    limit: i64,
}

async fn list_logs(
    State(s): State<ZigbeeHttpState>,
    Query(q): Query<LogsQuery>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let logs = s
        .zigbee_repo
        .list_logs(q.ieee_addr.as_deref(), q.from.as_deref(), q.to.as_deref(), q.limit)
        .await?;
    Ok(Json(logs))
}