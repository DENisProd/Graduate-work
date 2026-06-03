use std::sync::Arc;
use std::str::FromStr;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{delete, get},
    Json, Router,
};
use local_server_application::ports::{
    access_repository::CreateAccessRightCmd, AccessRepository,
};
use local_server_core::entities::access::{AccessRight, AccessRightType};
use serde::{Deserialize, Serialize};

use crate::http::error::AppError;

#[derive(Clone)]
struct RightState {
    repo: Arc<dyn AccessRepository>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccessRightResponse {
    pub id: String,
    pub access_right_type: String,
    pub resource_id: String,
    pub house_member_id: String,
    pub role_id: Option<String>,
    pub expires_at: Option<String>,
    pub created_at: String,
}

impl From<AccessRight> for AccessRightResponse {
    fn from(r: AccessRight) -> Self {
        Self {
            id: r.id,
            access_right_type: r.access_right_type.as_str().to_owned(),
            resource_id: r.resource_id,
            house_member_id: r.house_member_id,
            role_id: r.role_id,
            expires_at: r.expires_at.map(|t| t.to_rfc3339()),
            created_at: r.created_at.to_rfc3339(),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListRightsQuery {
    pub member_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRightBody {
    pub access_right_type: String,
    pub resource_id: String,
    pub house_member_id: String,
    pub role_id: Option<String>,
    pub granted_by_external_id: Option<String>,
    pub expires_at: Option<String>,
}

pub fn router(repo: Arc<dyn AccessRepository>) -> Router {
    let state = RightState { repo };
    Router::new()
        .route(
            "/access-rights",
            get(list_rights).post(create_right),
        )
        .route("/access-rights/:id", delete(delete_right))
        .with_state(state)
}

async fn list_rights(
    State(s): State<RightState>,
    Query(q): Query<ListRightsQuery>,
) -> Result<Json<Vec<AccessRightResponse>>, AppError> {
    let member_id = q.member_id.unwrap_or_default();
    let rights = s.repo.list_rights_for_member(&member_id).await?;
    Ok(Json(rights.into_iter().map(AccessRightResponse::from).collect()))
}

async fn create_right(
    State(s): State<RightState>,
    Json(body): Json<CreateRightBody>,
) -> Result<(StatusCode, Json<AccessRightResponse>), AppError> {
    let rt = AccessRightType::from_str(&body.access_right_type)
        .map_err(|_| local_server_application::DomainError::Validation(
            format!("unknown access_right_type: {}", body.access_right_type),
        ))?;
    let right = s
        .repo
        .create_right(CreateAccessRightCmd {
            access_right_type: rt,
            resource_id: body.resource_id,
            house_member_id: body.house_member_id,
            role_id: body.role_id,
            granted_by_external_id: body.granted_by_external_id,
            expires_at: body.expires_at,
        })
        .await?;
    Ok((StatusCode::CREATED, Json(AccessRightResponse::from(right))))
}

async fn delete_right(
    State(s): State<RightState>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    s.repo.delete_right(&id).await?;
    Ok(StatusCode::NO_CONTENT)
}