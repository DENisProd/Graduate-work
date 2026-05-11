use std::sync::Arc;

use axum::{
    extract::{Query, State},
    routing::post,
    Json, Router,
};
use local_server_application::{ports::AccessRepository, services::AccessEvaluator};
use serde::{Deserialize, Serialize};

use crate::http::error::AppError;

#[derive(Clone)]
struct CheckState {
    repo: Arc<dyn AccessRepository>,
    evaluator: Arc<AccessEvaluator>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CheckBody {
    user_id: String,
    resource_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CheckResponse {
    has_access: bool,
    effective_right_type: Option<String>,
    reason: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RebuildQuery {
    house_id: String,
}

pub fn router(repo: Arc<dyn AccessRepository>, evaluator: Arc<AccessEvaluator>) -> Router {
    let state = CheckState { repo, evaluator };
    Router::new()
        .route("/access-control/check", post(check_access))
        .route("/access/check", post(check_access_alias))
        .route("/permissions/rebuild", post(rebuild_permissions))
        .with_state(state)
}

async fn check_access(
    State(s): State<CheckState>,
    Json(body): Json<CheckBody>,
) -> Result<Json<CheckResponse>, AppError> {
    let result = s.evaluator.check(&body.user_id, &body.resource_id).await?;
    Ok(Json(CheckResponse {
        has_access: result.has_access,
        effective_right_type: result.effective_right_type,
        reason: result.reason,
    }))
}

async fn check_access_alias(
    state: State<CheckState>,
    body: Json<CheckBody>,
) -> Result<Json<CheckResponse>, AppError> {
    check_access(state, body).await
}

async fn rebuild_permissions(
    State(s): State<CheckState>,
    Query(q): Query<RebuildQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let count = s.repo.rebuild_effective(&q.house_id).await?;
    s.evaluator.invalidate_cache();
    Ok(Json(serde_json::json!({ "rebuilt": count })))
}
