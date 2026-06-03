use std::sync::Arc;

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
};
use local_server_application::{
    ports::{
        CreateScenarioCmd, ScenarioRepository, UpdateScenarioCmd,
        scenario_repository::ScenarioExecutionRepository,
    },
    services::ScenarioEngine,
};
use local_server_core::entities::scenario::ScenarioStatus;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{PageResponse, error::AppError};

#[derive(Clone)]
pub struct ScenariosState {
    pub repo: Arc<dyn ScenarioRepository>,
    pub exec_repo: Arc<dyn ScenarioExecutionRepository>,
    pub engine: Arc<ScenarioEngine>,
}

pub fn router(
    repo: Arc<dyn ScenarioRepository>,
    exec_repo: Arc<dyn ScenarioExecutionRepository>,
    engine: Arc<ScenarioEngine>,
) -> Router {
    let state = ScenariosState { repo, exec_repo, engine };
    Router::new()
        .route("/scenarios", get(list_scenarios).post(create_scenario))
        .route("/scenarios/webhook/:token", post(trigger_webhook))
        .route(
            "/scenarios/:id",
            get(get_scenario).patch(update_scenario).delete(delete_scenario),
        )
        .with_state(state)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScenarioResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub house_id: String,
    pub creator_id: String,
    pub definition: serde_json::Value,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<local_server_core::entities::scenario::Scenario> for ScenarioResponse {
    fn from(s: local_server_core::entities::scenario::Scenario) -> Self {
        Self {
            id: s.id,
            name: s.name,
            description: s.description,
            house_id: s.house_id,
            creator_id: s.creator_id,
            definition: s.definition,
            status: s.status.as_str().to_string(),
            created_at: s.created_at.to_rfc3339(),
            updated_at: s.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateScenarioBody {
    pub name: String,
    pub description: Option<String>,
    pub house_id: String,
    pub creator_id: Option<String>,
    pub definition: serde_json::Value,
    pub status: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateScenarioBody {
    pub name: Option<String>,
    pub description: Option<String>,
    pub definition: Option<serde_json::Value>,
    pub status: Option<String>,
}

#[derive(Deserialize)]
pub struct ListQuery {
    pub house_id: Option<String>,
    #[serde(default)]
    pub page: i64,
    #[serde(default = "default_size")]
    pub size: i64,
}

fn default_size() -> i64 {
    20
}

async fn list_scenarios(
    State(s): State<ScenariosState>,
    Query(q): Query<ListQuery>,
) -> Result<Json<PageResponse<ScenarioResponse>>, AppError> {
    let (items, total) = s.repo.list(q.house_id.as_deref(), q.page, q.size).await?;
    let content: Vec<ScenarioResponse> = items.into_iter().map(Into::into).collect();
    Ok(Json(PageResponse::from_result(content, total, q.page, q.size)))
}

async fn get_scenario(
    State(s): State<ScenariosState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ScenarioResponse>, AppError> {
    let scenario = s
        .repo
        .find_by_id(&id)
        .await?
        .ok_or_else(|| local_server_application::DomainError::not_found("scenario", id.to_string()))?;
    Ok(Json(scenario.into()))
}

async fn create_scenario(
    State(s): State<ScenariosState>,
    Json(body): Json<CreateScenarioBody>,
) -> Result<(StatusCode, Json<ScenarioResponse>), AppError> {
    let status = body.status.as_deref().and_then(parse_status).unwrap_or(ScenarioStatus::Offline);

    let scenario = s
        .repo
        .create(CreateScenarioCmd {
            name: body.name,
            description: body.description,
            house_id: body.house_id,
            creator_id: body.creator_id.unwrap_or_else(|| "system".to_string()),
            definition: body.definition,
            status,
        })
        .await?;

    if scenario.status == ScenarioStatus::Online {
        if let Err(e) = s.engine.register(scenario.clone()).await {
            tracing::warn!(error = %e, "failed to register new scenario in engine");
        }
    }

    Ok((StatusCode::CREATED, Json(scenario.into())))
}

async fn update_scenario(
    State(s): State<ScenariosState>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateScenarioBody>,
) -> Result<Json<ScenarioResponse>, AppError> {
    let new_status = body.status.as_deref().and_then(parse_status);

    let updated = s
        .repo
        .update(
            &id,
            UpdateScenarioCmd {
                name: body.name,
                description: body.description,
                definition: body.definition,
                status: new_status,
            },
        )
        .await?;

    if let Err(e) = s.engine.deregister(&id).await {
        tracing::warn!(error = %e, scenario_id = %id, "deregister failed during update");
    }
    if updated.status == ScenarioStatus::Online {
        if let Err(e) = s.engine.register(updated.clone()).await {
            tracing::warn!(error = %e, scenario_id = %id, "re-register failed during update");
        }
    }

    Ok(Json(updated.into()))
}

async fn delete_scenario(
    State(s): State<ScenariosState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    if let Err(e) = s.engine.deregister(&id).await {
        tracing::warn!(error = %e, scenario_id = %id, "deregister failed before delete");
    }
    s.repo.delete(&id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn trigger_webhook(
    State(s): State<ScenariosState>,
    Path(token): Path<String>,
) -> Result<StatusCode, AppError> {
    s.engine.trigger_by_webhook(&token).await?;
    Ok(StatusCode::NO_CONTENT)
}

fn parse_status(s: &str) -> Option<ScenarioStatus> {
    use std::str::FromStr;
    ScenarioStatus::from_str(s).ok()
}