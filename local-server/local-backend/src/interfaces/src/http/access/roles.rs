use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use local_server_application::ports::{
    access_repository::{CreateRoleCmd, UpdateRoleCmd},
    AccessRepository,
};
use local_server_core::entities::access::HouseRole;
use serde::{Deserialize, Serialize};

use crate::http::error::AppError;

#[derive(Clone)]
struct RoleState {
    repo: Arc<dyn AccessRepository>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoleResponse {
    pub id: String,
    pub name: String,
    pub priority: i32,
    pub is_system: bool,
    pub house_id: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<HouseRole> for RoleResponse {
    fn from(r: HouseRole) -> Self {
        Self {
            id: r.id,
            name: r.name,
            priority: r.priority,
            is_system: r.is_system,
            house_id: r.house_id,
            created_at: r.created_at.to_rfc3339(),
            updated_at: r.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRoleBody {
    pub name: String,
    pub priority: Option<i32>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRoleBody {
    pub name: Option<String>,
    pub priority: Option<i32>,
}

pub fn router(repo: Arc<dyn AccessRepository>) -> Router {
    let state = RoleState { repo };
    Router::new()
        .route("/houses/:house_id/roles", get(list_roles).post(create_role))
        .route(
            "/house-roles/:id",
            get(get_role).put(update_role).delete(delete_role),
        )
        .with_state(state)
}

async fn list_roles(
    State(s): State<RoleState>,
    Path(house_id): Path<String>,
) -> Result<Json<Vec<RoleResponse>>, AppError> {
    let roles = s.repo.list_roles(&house_id).await?;
    Ok(Json(roles.into_iter().map(RoleResponse::from).collect()))
}

async fn get_role(
    State(s): State<RoleState>,
    Path(id): Path<String>,
) -> Result<Json<RoleResponse>, AppError> {
    let role = s
        .repo
        .find_role(&id)
        .await?
        .ok_or_else(|| local_server_application::DomainError::not_found("role", &id))?;
    Ok(Json(RoleResponse::from(role)))
}

async fn create_role(
    State(s): State<RoleState>,
    Path(house_id): Path<String>,
    Json(body): Json<CreateRoleBody>,
) -> Result<(StatusCode, Json<RoleResponse>), AppError> {
    let role = s
        .repo
        .create_role(CreateRoleCmd {
            name: body.name,
            priority: body.priority.unwrap_or(0),
            house_id,
        })
        .await?;
    Ok((StatusCode::CREATED, Json(RoleResponse::from(role))))
}

async fn update_role(
    State(s): State<RoleState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateRoleBody>,
) -> Result<Json<RoleResponse>, AppError> {
    let role = s
        .repo
        .update_role(&id, UpdateRoleCmd { name: body.name, priority: body.priority })
        .await?;
    Ok(Json(RoleResponse::from(role)))
}

async fn delete_role(
    State(s): State<RoleState>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    s.repo.delete_role(&id).await?;
    Ok(StatusCode::NO_CONTENT)
}
