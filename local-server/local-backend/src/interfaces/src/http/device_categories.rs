use std::sync::Arc;

use axum::{extract::State, routing::get, Json, Router};
use local_server_application::ports::device_repository::DeviceRepository;
use local_server_core::entities::device::{DeviceCategory, DeviceType};
use serde::Serialize;
use utoipa::ToSchema;

use super::error::AppError;

#[derive(Clone)]
pub struct CategoriesState {
    pub repo: Arc<dyn DeviceRepository>,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DeviceCategoryResponse {
    pub id: i64,
    pub code: String,
    pub device_type_id: i64,
    pub active: bool,
    pub is_moderated: bool,
}

impl From<DeviceCategory> for DeviceCategoryResponse {
    fn from(c: DeviceCategory) -> Self {
        Self {
            id: c.id,
            code: c.code,
            device_type_id: c.device_type_id,
            active: c.active,
            is_moderated: c.is_moderated,
        }
    }
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DeviceTypeResponse {
    pub id: i64,
    pub code: String,
    pub active: bool,
}

impl From<DeviceType> for DeviceTypeResponse {
    fn from(t: DeviceType) -> Self {
        Self { id: t.id, code: t.code, active: t.active }
    }
}

pub fn router(repo: Arc<dyn DeviceRepository>) -> Router {
    let state = CategoriesState { repo };
    Router::new()
        .route("/device-categories/all", get(list_all_categories))
        .route("/device-types", get(list_all_types))
        .with_state(state)
}

#[utoipa::path(get, path = "/api/v1/device-categories/all",
    responses((status = 200, description = "All active device categories")),
    tag = "device-categories")]
async fn list_all_categories(
    State(s): State<CategoriesState>,
) -> Result<Json<Vec<DeviceCategoryResponse>>, AppError> {
    let cats = s.repo.find_all_categories().await?;
    Ok(Json(cats.into_iter().map(DeviceCategoryResponse::from).collect()))
}

#[utoipa::path(get, path = "/api/v1/device-types",
    responses((status = 200, description = "All active device types")),
    tag = "device-types")]
async fn list_all_types(
    State(s): State<CategoriesState>,
) -> Result<Json<Vec<DeviceTypeResponse>>, AppError> {
    let types = s.repo.find_all_types().await?;
    Ok(Json(types.into_iter().map(DeviceTypeResponse::from).collect()))
}