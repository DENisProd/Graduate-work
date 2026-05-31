use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, put},
    Json, Router,
};
use local_server_application::ports::{
    access_repository::{CreatePolicyCmd, UpdatePolicyCmd},
    AccessRepository,
};
use local_server_core::entities::access::AccessPolicy;
use serde::{Deserialize, Serialize};

use crate::http::error::AppError;

#[derive(Clone)]
struct PolicyState {
    repo: Arc<dyn AccessRepository>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PolicyResponse {
    pub id: String,
    pub name: String,
    pub effect: String,
    pub subject_type: String,
    pub subject_id: Option<String>,
    pub condition: Option<serde_json::Value>,
    pub priority: i32,
    pub house_id: String,
    pub resource_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<AccessPolicy> for PolicyResponse {
    fn from(p: AccessPolicy) -> Self {
        Self {
            id: p.id,
            name: p.name,
            effect: p.effect,
            subject_type: p.subject_type,
            subject_id: p.subject_id,
            condition: p.condition,
            priority: p.priority,
            house_id: p.house_id,
            resource_id: p.resource_id,
            created_at: p.created_at.to_rfc3339(),
            updated_at: p.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListPoliciesQuery {
    pub house_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePolicyBody {
    pub name: String,
    pub effect: String,
    pub subject_type: String,
    pub subject_id: Option<String>,
    pub condition: Option<serde_json::Value>,
    pub priority: Option<i32>,
    pub house_id: String,
    pub resource_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePolicyBody {
    pub name: Option<String>,
    pub effect: Option<String>,
    pub condition: Option<serde_json::Value>,
    pub priority: Option<i32>,
}

pub fn router(repo: Arc<dyn AccessRepository>) -> Router {
    let state = PolicyState { repo };
    Router::new()
        .route(
            "/access-policies",
            get(list_policies).post(create_policy),
        )
        .route(
            "/access-policies/:id",
            put(update_policy).delete(delete_policy),
        )
        .with_state(state)
}

async fn list_policies(
    State(s): State<PolicyState>,
    Query(q): Query<ListPoliciesQuery>,
) -> Result<Json<Vec<PolicyResponse>>, AppError> {
    let house_id = q.house_id.unwrap_or_default();
    let items = s.repo.list_policies(&house_id).await?;
    Ok(Json(items.into_iter().map(PolicyResponse::from).collect()))
}

async fn create_policy(
    State(s): State<PolicyState>,
    Json(body): Json<CreatePolicyBody>,
) -> Result<(StatusCode, Json<PolicyResponse>), AppError> {
    let policy = s
        .repo
        .create_policy(CreatePolicyCmd {
            name: body.name,
            effect: body.effect,
            subject_type: body.subject_type,
            subject_id: body.subject_id,
            condition: body.condition,
            priority: body.priority.unwrap_or(0),
            house_id: body.house_id,
            resource_id: body.resource_id,
        })
        .await?;
    Ok((StatusCode::CREATED, Json(PolicyResponse::from(policy))))
}

async fn update_policy(
    State(s): State<PolicyState>,
    Path(id): Path<String>,
    Json(body): Json<UpdatePolicyBody>,
) -> Result<Json<PolicyResponse>, AppError> {
    let policy = s
        .repo
        .update_policy(
            &id,
            UpdatePolicyCmd {
                name: body.name,
                effect: body.effect,
                condition: body.condition,
                priority: body.priority,
            },
        )
        .await?;
    Ok(Json(PolicyResponse::from(policy)))
}

async fn delete_policy(
    State(s): State<PolicyState>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    s.repo.delete_policy(&id).await?;
    Ok(StatusCode::NO_CONTENT)
}
