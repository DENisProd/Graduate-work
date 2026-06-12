//! Local password authentication — offline login against users pulled from the
//! cloud. Distinct from `/system/auth/*`, which pairs this server with the
//! cloud (device authorization).

use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use local_server_application::ports::LocalAuthUser;
use local_server_application::DomainError;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::error::AppError;
use crate::HttpAppState;

/// Default password issued to every user on first cloud sync.
const DEFAULT_PASSWORD: &str = "0000";

pub fn router(state: HttpAppState) -> Router {
    Router::new()
        .route("/auth/users", get(list_users))
        .route("/auth/login", post(login))
        .route("/auth/change-password", post(change_password))
        .with_state(state)
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AuthUserResponse {
    pub id: String,
    pub external_user_id: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub must_change_password: bool,
    pub is_owner: bool,
}

impl From<LocalAuthUser> for AuthUserResponse {
    fn from(u: LocalAuthUser) -> Self {
        Self {
            id: u.id,
            external_user_id: u.external_user_id,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            must_change_password: u.must_change_password,
            is_owner: u.is_owner,
        }
    }
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct LoginRequest {
    /// Local user id or external (cloud) user id.
    pub user_id: String,
    pub password: String,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordRequest {
    pub user_id: String,
    pub current_password: String,
    pub new_password: String,
}

/// List users that can log in. Lazily issues the default password to any newly
/// synced user so they appear with a usable credential.
#[utoipa::path(
    get,
    path = "/api/v1/auth/users",
    responses((status = 200, description = "Users available for login", body = [AuthUserResponse])),
    tag = "auth"
)]
async fn list_users(
    State(state): State<HttpAppState>,
) -> Result<Json<Vec<AuthUserResponse>>, AppError> {
    state.local_auth.ensure_defaults(DEFAULT_PASSWORD).await?;
    let users = state.local_auth.list_users().await?;
    Ok(Json(users.into_iter().map(AuthUserResponse::from).collect()))
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Authenticated", body = AuthUserResponse),
        (status = 401, description = "Invalid credentials"),
    ),
    tag = "auth"
)]
async fn login(
    State(state): State<HttpAppState>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<AuthUserResponse>, AppError> {
    // Make sure pulled-but-unhashed users have a default password before login.
    state.local_auth.ensure_defaults(DEFAULT_PASSWORD).await?;
    let user = state
        .local_auth
        .verify_credentials(&body.user_id, &body.password)
        .await?
        .ok_or_else(|| DomainError::Forbidden("Invalid user or password".into()))?;
    Ok(Json(AuthUserResponse::from(user)))
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/change-password",
    request_body = ChangePasswordRequest,
    responses(
        (status = 200, description = "Password changed", body = AuthUserResponse),
        (status = 400, description = "Current password incorrect"),
    ),
    tag = "auth"
)]
async fn change_password(
    State(state): State<HttpAppState>,
    Json(body): Json<ChangePasswordRequest>,
) -> Result<Json<AuthUserResponse>, AppError> {
    let user = state
        .local_auth
        .change_password(&body.user_id, &body.current_password, &body.new_password)
        .await?;
    Ok(Json(AuthUserResponse::from(user)))
}
