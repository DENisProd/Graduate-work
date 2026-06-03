use std::sync::Arc;

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::get,
};
use local_server_application::{
    DomainError,
    ports::scenario_repository::ScenarioExecutionRepository,
    services::ScenarioEngine,
};
use local_server_core::entities::scenario::ScenarioExecution;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{PageResponse, error::AppError};

#[derive(Clone)]
pub struct ScenarioExecutionsState {
    pub exec_repo: Arc<dyn ScenarioExecutionRepository>,
    pub engine: Arc<ScenarioEngine>,
}

pub fn router(
    exec_repo: Arc<dyn ScenarioExecutionRepository>,
    engine: Arc<ScenarioEngine>,
) -> Router {
    let state = ScenarioExecutionsState { exec_repo, engine };
    Router::new()
        .route("/scenario-executions", get(list_executions).post(trigger_manual))
        .route("/scenario-executions/:id", get(get_execution))
        .with_state(state)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionResponse {
    pub id: Uuid,
    pub scenario_id: Uuid,
    pub status: String,
    pub triggered_by: String,
    pub trigger_data: Option<serde_json::Value>,
    pub error_message: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
}

impl From<ScenarioExecution> for ExecutionResponse {
    fn from(e: ScenarioExecution) -> Self {
        Self {
            id: e.id,
            scenario_id: e.scenario_id,
            status: e.status.as_str().to_string(),
            triggered_by: e.triggered_by.as_str().to_string(),
            trigger_data: e.trigger_data,
            error_message: e.error_message,
            started_at: e.started_at.to_rfc3339(),
            ended_at: e.ended_at.map(|t| t.to_rfc3339()),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TriggerManualBody {
    pub scenario_id: Uuid,
}

#[derive(Deserialize)]
pub struct ListQuery {
    pub scenario_id: Option<Uuid>,
    #[serde(default)]
    pub page: i64,
    #[serde(default = "default_size")]
    pub size: i64,
}

fn default_size() -> i64 {
    20
}

async fn list_executions(
    State(s): State<ScenarioExecutionsState>,
    Query(q): Query<ListQuery>,
) -> Result<Json<PageResponse<ExecutionResponse>>, AppError> {
    let (items, total) = if let Some(sid) = q.scenario_id {
        let items = s.exec_repo.list_executions(&sid, q.size).await?;
        let total = items.len() as i64;
        (items, total)
    } else {
        s.exec_repo.list_all_executions(q.page, q.size).await?
    };

    let content: Vec<ExecutionResponse> = items.into_iter().map(Into::into).collect();
    Ok(Json(PageResponse::from_result(content, total, q.page, q.size)))
}

async fn get_execution(
    State(s): State<ScenarioExecutionsState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ExecutionResponse>, AppError> {
    let exec = s
        .exec_repo
        .find_execution_by_id(&id)
        .await?
        .ok_or_else(|| DomainError::not_found("scenario_execution", id.to_string()))?;
    Ok(Json(exec.into()))
}

async fn trigger_manual(
    State(s): State<ScenarioExecutionsState>,
    Json(body): Json<TriggerManualBody>,
) -> Result<(StatusCode, Json<ExecutionResponse>), AppError> {
    let exec = s.engine.trigger_manual(&body.scenario_id).await?;
    Ok((StatusCode::CREATED, Json(exec.into())))
}