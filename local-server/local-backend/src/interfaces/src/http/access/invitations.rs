use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get},
    Json, Router,
};
use local_server_application::ports::{
    access_repository::CreateInvitationCmd, AccessRepository,
};
use local_server_core::entities::access::HouseInvitation;
use serde::{Deserialize, Serialize};

use crate::http::error::AppError;

#[derive(Clone)]
struct InvitationState {
    repo: Arc<dyn AccessRepository>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InvitationResponse {
    pub id: String,
    pub house_id: String,
    pub email: String,
    pub status: String,
    pub role_id: Option<String>,
    pub expires_at: String,
    pub created_at: String,
}

impl From<HouseInvitation> for InvitationResponse {
    fn from(i: HouseInvitation) -> Self {
        Self {
            id: i.id,
            house_id: i.house_id,
            email: i.email,
            status: i.status,
            role_id: i.role_id,
            expires_at: i.expires_at.to_rfc3339(),
            created_at: i.created_at.to_rfc3339(),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvitationBody {
    pub email: String,
    pub role_id: Option<String>,
    pub expires_in_hours: Option<u32>,
}

pub fn router(repo: Arc<dyn AccessRepository>) -> Router {
    let state = InvitationState { repo };
    Router::new()
        .route(
            "/houses/:house_id/invitations",
            get(list_invitations).post(create_invitation),
        )
        .route("/house-invitations/:id", delete(delete_invitation))
        .with_state(state)
}

async fn list_invitations(
    State(s): State<InvitationState>,
    Path(house_id): Path<String>,
) -> Result<Json<Vec<InvitationResponse>>, AppError> {
    let items = s.repo.list_invitations(&house_id).await?;
    Ok(Json(items.into_iter().map(InvitationResponse::from).collect()))
}

async fn create_invitation(
    State(s): State<InvitationState>,
    Path(house_id): Path<String>,
    Json(body): Json<CreateInvitationBody>,
) -> Result<(StatusCode, Json<InvitationResponse>), AppError> {
    let inv = s
        .repo
        .create_invitation(CreateInvitationCmd {
            house_id,
            email: body.email,
            role_id: body.role_id,
            expires_in_hours: body.expires_in_hours.unwrap_or(72),
        })
        .await?;
    Ok((StatusCode::CREATED, Json(InvitationResponse::from(inv))))
}

async fn delete_invitation(
    State(s): State<InvitationState>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    s.repo.delete_invitation(&id).await?;
    Ok(StatusCode::NO_CONTENT)
}