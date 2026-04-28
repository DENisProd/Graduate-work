use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;

use local_server_application::{
    ports::{MqttClient, ZigbeeRepository},
    DomainError,
};

use super::error::AppError;
use crate::websocket::protocol::{CommandPayload, ZigbeeStateDto};

// ─── State ───────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct ZigbeeHttpState {
    pub repo: Arc<dyn ZigbeeRepository>,
    pub mqtt: Option<Arc<dyn MqttClient>>,
    pub prefix: String,
}

// ─── Router ───────────────────────────────────────────────────────────────────

pub fn router(
    repo: Arc<dyn ZigbeeRepository>,
    mqtt: Option<Arc<dyn MqttClient>>,
    prefix: String,
) -> Router {
    let state = ZigbeeHttpState { repo, mqtt, prefix };
    Router::new()
        .route("/zigbee/devices/:ieee/state", get(get_last_state))
        .route("/zigbee/devices/:ieee/history", get(get_history))
        .route("/zigbee/devices/:ieee/command", post(send_command))
        .with_state(state)
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async fn get_last_state(
    State(s): State<ZigbeeHttpState>,
    Path(ieee): Path<String>,
) -> Result<Json<ZigbeeStateDto>, AppError> {
    let state = s
        .repo
        .last_state(&ieee)
        .await?
        .ok_or_else(|| DomainError::not_found("zigbee_state", &ieee))?;
    Ok(Json(ZigbeeStateDto::from(&state)))
}

#[derive(Deserialize)]
struct HistoryQuery {
    #[serde(default = "default_limit")]
    limit: i64,
}
fn default_limit() -> i64 { 20 }

async fn get_history(
    State(s): State<ZigbeeHttpState>,
    Path(ieee): Path<String>,
    Query(q): Query<HistoryQuery>,
) -> Result<Json<Vec<ZigbeeStateDto>>, AppError> {
    let states = s.repo.list_states(&ieee, q.limit).await?;
    Ok(Json(states.iter().map(ZigbeeStateDto::from).collect()))
}

async fn send_command(
    State(s): State<ZigbeeHttpState>,
    Path(_ieee): Path<String>,
    Json(body): Json<CommandPayload>,
) -> Result<StatusCode, AppError> {
    let mqtt = s
        .mqtt
        .as_ref()
        .ok_or_else(|| DomainError::DependencyUnavailable("MQTT not configured".into()))?;
    let topic = format!("{}/{}/set", s.prefix, body.friendly_name);
    let payload = serde_json::to_vec(&body.payload)
        .map_err(|e| DomainError::Validation(e.to_string()))?;
    mqtt.publish(&topic, &payload).await?;
    Ok(StatusCode::NO_CONTENT)
}
