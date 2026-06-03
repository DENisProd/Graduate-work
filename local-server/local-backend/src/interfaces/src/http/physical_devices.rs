use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use local_server_application::ports::physical_device_repository::{
    CreatePhysicalDeviceCmd, PhysicalDeviceFilter, PhysicalDeviceRepository,
    UpdatePhysicalDeviceCmd,
};
use local_server_core::entities::physical_device::PhysicalDevice;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use super::error::AppError;

#[derive(Clone)]
pub struct PhysicalDevicesState {
    pub repo: Arc<dyn PhysicalDeviceRepository>,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PhysicalDeviceResponse {
    pub id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub house_id: Option<String>,
    pub room_id: Option<String>,
    pub device_id: Option<i64>,
    pub device_category_id: Option<i64>,
    pub protocol_address: Option<String>,
    pub network_address: Option<i64>,
    #[serde(rename = "type")]
    pub device_type: Option<String>,
    pub manufacturer_name: Option<String>,
    pub model: Option<String>,
    pub friendly_name: Option<String>,
    pub firmware_version: Option<String>,
    pub last_seen: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<PhysicalDevice> for PhysicalDeviceResponse {
    fn from(d: PhysicalDevice) -> Self {
        Self {
            id: d.id.to_string(),
            name: d.name,
            description: d.description,
            house_id: d.house_id,
            room_id: d.room_id,
            device_id: d.device_id,
            device_category_id: d.device_category_id,
            protocol_address: d.protocol_address,
            network_address: d.network_address,
            device_type: d.r#type.map(|t| t.as_str().to_owned()),
            manufacturer_name: d.manufacturer_name,
            model: d.model,
            friendly_name: d.friendly_name,
            firmware_version: d.firmware_version,
            last_seen: d.last_seen.map(|dt| dt.to_rfc3339()),
            created_at: d.created_at.to_rfc3339(),
            updated_at: d.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreatePhysicalDeviceBody {
    pub name: Option<String>,
    pub description: Option<String>,
    pub house_id: Option<String>,
    pub room_id: Option<String>,
    pub device_id: Option<i64>,
    pub device_category_id: Option<i64>,
    pub protocol_address: Option<String>,
    #[serde(rename = "type")]
    pub device_type: Option<String>,
    pub manufacturer_name: Option<String>,
    pub model: Option<String>,
    pub friendly_name: Option<String>,
    pub firmware_version: Option<String>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePhysicalDeviceBody {
    pub name: Option<String>,
    pub description: Option<String>,
    pub room_id: Option<String>,
    pub device_id: Option<i64>,
    pub device_category_id: Option<i64>,
    pub friendly_name: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListQuery {
    pub house_id: Option<String>,
    pub room_id: Option<String>,
}

pub fn router(repo: Arc<dyn PhysicalDeviceRepository>) -> Router {
    let state = PhysicalDevicesState { repo };
    Router::new()
        .route("/physical-devices", get(list_physical_devices).post(create_physical_device))
        .route(
            "/physical-devices/:id",
            get(get_physical_device)
                .patch(update_physical_device)
                .delete(delete_physical_device),
        )
        .with_state(state)
}

#[utoipa::path(get, path = "/api/v1/physical-devices",
    responses((status = 200, description = "List of physical devices")),
    tag = "physical-devices")]
async fn list_physical_devices(
    State(s): State<PhysicalDevicesState>,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<PhysicalDeviceResponse>>, AppError> {
    let devices = s
        .repo
        .find_all(PhysicalDeviceFilter { house_id: q.house_id, room_id: q.room_id })
        .await?;
    Ok(Json(devices.into_iter().map(PhysicalDeviceResponse::from).collect()))
}

#[utoipa::path(post, path = "/api/v1/physical-devices",
    request_body = CreatePhysicalDeviceBody,
    responses((status = 201, body = PhysicalDeviceResponse)),
    tag = "physical-devices")]
async fn create_physical_device(
    State(s): State<PhysicalDevicesState>,
    Json(body): Json<CreatePhysicalDeviceBody>,
) -> Result<(StatusCode, Json<PhysicalDeviceResponse>), AppError> {
    let device = s
        .repo
        .create(CreatePhysicalDeviceCmd {
            name: body.name,
            description: body.description,
            house_id: body.house_id,
            room_id: body.room_id,
            device_id: body.device_id,
            device_category_id: body.device_category_id,
            protocol_address: body.protocol_address,
            r#type: body.device_type,
            manufacturer_name: body.manufacturer_name,
            model: body.model,
            friendly_name: body.friendly_name,
            firmware_version: body.firmware_version,
        })
        .await?;
    Ok((StatusCode::CREATED, Json(PhysicalDeviceResponse::from(device))))
}

async fn get_physical_device(
    State(s): State<PhysicalDevicesState>,
    Path(id): Path<Uuid>,
) -> Result<Json<PhysicalDeviceResponse>, AppError> {
    let device = s
        .repo
        .find_by_id(id)
        .await?
        .ok_or_else(|| {
            local_server_application::DomainError::not_found("physical_device", id.to_string())
        })?;
    Ok(Json(PhysicalDeviceResponse::from(device)))
}

async fn update_physical_device(
    State(s): State<PhysicalDevicesState>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdatePhysicalDeviceBody>,
) -> Result<Json<PhysicalDeviceResponse>, AppError> {
    let device = s
        .repo
        .update(
            id,
            UpdatePhysicalDeviceCmd {
                name: body.name,
                description: body.description,
                room_id: body.room_id,
                device_id: body.device_id,
                device_category_id: body.device_category_id,
                friendly_name: body.friendly_name,
            },
        )
        .await?;
    Ok(Json(PhysicalDeviceResponse::from(device)))
}

async fn delete_physical_device(
    State(s): State<PhysicalDevicesState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    s.repo.delete(id).await?;
    Ok(StatusCode::NO_CONTENT)
}