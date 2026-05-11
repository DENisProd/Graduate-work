use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get},
    Json, Router,
};
use local_server_application::ports::{
    access_repository::AddMemberCmd,
    AccessRepository,
};
use local_server_core::entities::access::HouseMember;
use serde::{Deserialize, Serialize};

use crate::http::error::AppError;

#[derive(Clone)]
struct MemberState {
    repo: Arc<dyn AccessRepository>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemberResponse {
    pub id: String,
    pub house_id: String,
    pub user_id: String,
    pub joined_at: String,
    pub removed_at: Option<String>,
}

impl From<HouseMember> for MemberResponse {
    fn from(m: HouseMember) -> Self {
        Self {
            id: m.id,
            house_id: m.house_id,
            user_id: m.user_id,
            joined_at: m.joined_at.to_rfc3339(),
            removed_at: m.removed_at.map(|t| t.to_rfc3339()),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddMemberBody {
    pub external_user_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignRoleBody {
    pub role_id: String,
}

pub fn router(repo: Arc<dyn AccessRepository>) -> Router {
    let state = MemberState { repo };
    Router::new()
        .route("/houses/:house_id/members", get(list_members).post(add_member))
        .route("/houses/:house_id/members/:member_id", delete(remove_member))
        .route(
            "/house-members/:member_id/roles",
            get(list_member_roles).post(assign_role),
        )
        .route(
            "/house-members/:member_id/roles/:role_id",
            delete(unassign_role),
        )
        .with_state(state)
}

async fn list_members(
    State(s): State<MemberState>,
    Path(house_id): Path<String>,
) -> Result<Json<Vec<MemberResponse>>, AppError> {
    let members = s.repo.list_members(&house_id).await?;
    Ok(Json(members.into_iter().map(MemberResponse::from).collect()))
}

async fn add_member(
    State(s): State<MemberState>,
    Path(house_id): Path<String>,
    Json(body): Json<AddMemberBody>,
) -> Result<(StatusCode, Json<MemberResponse>), AppError> {
    let member = s
        .repo
        .add_member(AddMemberCmd {
            house_id,
            external_user_id: body.external_user_id,
        })
        .await?;
    Ok((StatusCode::CREATED, Json(MemberResponse::from(member))))
}

async fn remove_member(
    State(s): State<MemberState>,
    Path((_, member_id)): Path<(String, String)>,
) -> Result<StatusCode, AppError> {
    s.repo.remove_member(&member_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn list_member_roles(
    State(s): State<MemberState>,
    Path(member_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let roles = s.repo.list_member_roles(&member_id).await?;
    Ok(Json(serde_json::json!(roles
        .into_iter()
        .map(|r| serde_json::json!({ "id": r.id, "name": r.name, "priority": r.priority }))
        .collect::<Vec<_>>())))
}

async fn assign_role(
    State(s): State<MemberState>,
    Path(member_id): Path<String>,
    Json(body): Json<AssignRoleBody>,
) -> Result<StatusCode, AppError> {
    s.repo.assign_role(&member_id, &body.role_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn unassign_role(
    State(s): State<MemberState>,
    Path((member_id, role_id)): Path<(String, String)>,
) -> Result<StatusCode, AppError> {
    s.repo.unassign_role(&member_id, &role_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
