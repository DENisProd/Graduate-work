use std::sync::Arc;

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::get,
};
use local_server_application::ports::{
    CreateWidgetDashboardCmd, UpdateWidgetDashboardCmd, WidgetDashboardRepository,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use local_server_application::DomainError;

use super::error::AppError;

#[derive(Clone)]
pub struct WidgetDashboardsState {
    pub repo: Arc<dyn WidgetDashboardRepository>,
}

pub fn router(repo: Arc<dyn WidgetDashboardRepository>) -> Router {
    let state = WidgetDashboardsState { repo };
    Router::new()
        .route(
            "/widget-dashboards",
            get(list_by_house).post(create_dashboard),
        )
        .route(
            "/widget-dashboards/:id",
            get(get_dashboard).put(update_dashboard).delete(delete_dashboard),
        )
        .with_state(state)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WidgetDashboardResponse {
    pub id: Uuid,
    pub house_id: String,
    pub user_id: String,
    pub name: String,
    pub is_default: bool,
    pub layouts: Value,
    pub widgets: Vec<Value>,
    pub cloud_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<local_server_core::entities::widget_dashboard::WidgetDashboard>
    for WidgetDashboardResponse
{
    fn from(d: local_server_core::entities::widget_dashboard::WidgetDashboard) -> Self {
        Self {
            id: d.id,
            house_id: d.house_id,
            user_id: d.user_id,
            name: d.name,
            is_default: d.is_default,
            layouts: d.layouts,
            widgets: d.widgets,
            cloud_id: d.cloud_id,
            created_at: d.created_at.to_rfc3339(),
            updated_at: d.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListQuery {
    pub house_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBody {
    pub house_id: String,
    pub user_id: String,
    pub name: String,
    #[serde(default)]
    pub is_default: bool,
    #[serde(default = "default_layouts")]
    pub layouts: Value,
    #[serde(default)]
    pub widgets: Vec<Value>,
}

fn default_layouts() -> Value {
    serde_json::json!({})
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateBody {
    pub name: Option<String>,
    pub is_default: Option<bool>,
    pub layouts: Option<Value>,
    pub widgets: Option<Vec<Value>>,
}

async fn list_by_house(
    State(s): State<WidgetDashboardsState>,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<WidgetDashboardResponse>>, AppError> {
    let house_id = q.house_id.unwrap_or_default();
    let dashboards = s.repo.find_by_house(&house_id).await?;
    Ok(Json(dashboards.into_iter().map(Into::into).collect()))
}

async fn get_dashboard(
    State(s): State<WidgetDashboardsState>,
    Path(id): Path<Uuid>,
) -> Result<Json<WidgetDashboardResponse>, AppError> {
    s.repo
        .find_by_id(&id)
        .await?
        .map(|d| Json(d.into()))
        .ok_or_else(|| AppError::Domain(DomainError::not_found("widget_dashboard", id.to_string())))
}

async fn create_dashboard(
    State(s): State<WidgetDashboardsState>,
    Json(body): Json<CreateBody>,
) -> Result<(StatusCode, Json<WidgetDashboardResponse>), AppError> {
    if let Some(existing) = s.repo.find_primary_for_house(&body.house_id).await? {
        return Ok((StatusCode::OK, Json(existing.into())));
    }

    if body.is_default {
        s.repo.clear_default(&body.house_id, &body.user_id).await?;
    }
    let cmd = CreateWidgetDashboardCmd {
        house_id: body.house_id,
        user_id: body.user_id,
        name: body.name,
        is_default: body.is_default,
        layouts: body.layouts,
        widgets: body.widgets,
    };
    let created = s.repo.create(cmd).await?;
    Ok((StatusCode::CREATED, Json(created.into())))
}

async fn update_dashboard(
    State(s): State<WidgetDashboardsState>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateBody>,
) -> Result<Json<WidgetDashboardResponse>, AppError> {
    if let Some(true) = body.is_default {
        if let Some(existing) = s.repo.find_by_id(&id).await? {
            s.repo.clear_default(&existing.house_id, &existing.user_id).await?;
        }
    }
    let cmd = UpdateWidgetDashboardCmd {
        name: body.name,
        is_default: body.is_default,
        layouts: body.layouts,
        widgets: body.widgets,
    };
    let updated = s.repo.update(&id, cmd).await?;
    Ok(Json(updated.into()))
}

async fn delete_dashboard(
    State(s): State<WidgetDashboardsState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    s.repo.delete(&id).await?;
    Ok(StatusCode::NO_CONTENT)
}