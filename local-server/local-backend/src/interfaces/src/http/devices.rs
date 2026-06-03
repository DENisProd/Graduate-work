use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, patch},
    Json, Router,
};
use local_server_application::ports::device_repository::{
    CreateDeviceCmd, DeviceRepository, UpdateDeviceCmd,
};
use local_server_core::entities::device::{Device, DeviceFunction, DeviceStatus};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::error::AppError;
use super::PageResponse;

#[derive(Clone)]
pub struct DevicesState {
    pub repo: Arc<dyn DeviceRepository>,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DeviceResponse {
    pub id: i64,
    pub code: String,
    pub device_category_id: i64,
    pub status: String,
    pub serial_number: Option<String>,
    pub firmware_version: Option<String>,
    pub active: bool,
    pub is_moderated: bool,
    pub last_seen_at: Option<String>,
}

impl From<Device> for DeviceResponse {
    fn from(d: Device) -> Self {
        Self {
            id: d.id,
            code: d.code,
            device_category_id: d.device_category_id,
            status: d.status.as_str().to_owned(),
            serial_number: d.serial_number,
            firmware_version: d.firmware_version,
            active: d.active,
            is_moderated: d.is_moderated,
            last_seen_at: d.last_seen_at,
        }
    }
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DeviceFunctionActionResponse {
    pub id: i64,
    pub code: String,
    pub device_function_id: i64,
    pub action_type: String,
    pub payload_template: Option<String>,
    pub active: bool,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DeviceFunctionResponse {
    pub id: i64,
    pub code: String,
    pub device_id: i64,
    pub function_type: String,
    pub current_value: Option<String>,
    pub min_value: Option<String>,
    pub max_value: Option<String>,
    pub unit: Option<String>,
    pub active: bool,
    pub actions: Vec<DeviceFunctionActionResponse>,
}

impl From<DeviceFunction> for DeviceFunctionResponse {
    fn from(f: DeviceFunction) -> Self {
        Self {
            id: f.id,
            code: f.code,
            device_id: f.device_id,
            function_type: f.function_type.as_str().to_owned(),
            current_value: f.current_value,
            min_value: f.min_value,
            max_value: f.max_value,
            unit: f.unit,
            active: f.active,
            actions: vec![],
        }
    }
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DeviceDetailedResponse {
    pub id: i64,
    pub code: String,
    pub device_category_id: i64,
    pub status: String,
    pub serial_number: Option<String>,
    pub firmware_version: Option<String>,
    pub active: bool,
    pub is_moderated: bool,
    pub last_seen_at: Option<String>,
    pub functions: Vec<DeviceFunctionResponse>,
    pub translations: Vec<TranslationResponse>,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TranslationResponse {
    pub locale: String,
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateDeviceBody {
    pub code: String,
    pub device_category_id: i64,
    pub status: Option<DeviceStatus>,
    pub serial_number: Option<String>,
    pub firmware_version: Option<String>,
    #[serde(default = "default_true")]
    pub active: bool,
    #[serde(default)]
    pub is_moderated: bool,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDeviceBody {
    pub code: String,
    pub device_category_id: i64,
    pub status: Option<DeviceStatus>,
    pub serial_number: Option<String>,
    pub firmware_version: Option<String>,
    #[serde(default = "default_true")]
    pub active: bool,
}

#[derive(Deserialize)]
pub struct PageParams {
    #[serde(default)]
    pub page: i64,
    #[serde(default = "default_size")]
    pub size: i64,
}

#[derive(Deserialize)]
pub struct StatusQuery {
    pub status: DeviceStatus,
}

#[derive(Deserialize, ToSchema)]
pub struct UpdateValueBody {
    pub value: String,
}

fn default_true() -> bool { true }
fn default_size() -> i64 { 20 }

pub fn router(repo: Arc<dyn DeviceRepository>) -> Router {
    let state = DevicesState { repo };
    Router::new()
        .route("/devices", get(list_devices).post(create_device))
        .route("/devices/code/:code", get(get_device_by_code))
        .route(
            "/devices/:id",
            get(get_device).put(update_device).patch(soft_delete_device),
        )
        .route("/devices/:id/detailed", get(get_device_detailed))
        .route("/devices/:id/status", patch(update_device_status))
        .route(
            "/device-functions/by-device/:device_id/all",
            get(list_functions_by_device),
        )
        .route("/device-functions/:id/value", patch(update_function_value))
        .with_state(state)
}

#[utoipa::path(get, path = "/api/v1/devices",
    params(
        ("page" = Option<i64>, Query, description = "Page number (0-based)"),
        ("size" = Option<i64>, Query, description = "Page size"),
    ),
    responses((status = 200, description = "Paginated device list")),
    tag = "devices")]
async fn list_devices(
    State(s): State<DevicesState>,
    Query(p): Query<PageParams>,
) -> Result<Json<PageResponse<DeviceResponse>>, AppError> {
    let result = s.repo.find_all(p.page, p.size).await?;
    Ok(Json(PageResponse::from_result(
        result.content.into_iter().map(DeviceResponse::from).collect(),
        result.total_elements,
        result.page,
        result.size,
    )))
}

#[utoipa::path(get, path = "/api/v1/devices/{id}",
    responses((status = 200, body = DeviceResponse), (status = 404, description = "Not found")),
    tag = "devices")]
async fn get_device(
    State(s): State<DevicesState>,
    Path(id): Path<i64>,
) -> Result<Json<DeviceResponse>, AppError> {
    let device = s
        .repo
        .find_by_id(id)
        .await?
        .ok_or_else(|| local_server_application::DomainError::not_found("device", id.to_string()))?;
    Ok(Json(DeviceResponse::from(device)))
}

async fn get_device_detailed(
    State(s): State<DevicesState>,
    Path(id): Path<i64>,
) -> Result<Json<DeviceDetailedResponse>, AppError> {
    let detailed = s
        .repo
        .find_detailed(id)
        .await?
        .ok_or_else(|| local_server_application::DomainError::not_found("device", id.to_string()))?;

    let functions = detailed
        .functions
        .into_iter()
        .map(|f| DeviceFunctionResponse {
            id: f.id,
            code: f.code,
            device_id: f.device_id,
            function_type: f.function_type.as_str().to_owned(),
            current_value: f.current_value,
            min_value: f.min_value,
            max_value: f.max_value,
            unit: f.unit,
            active: f.active,
            actions: f
                .actions
                .into_iter()
                .map(|a| DeviceFunctionActionResponse {
                    id: a.id,
                    code: a.code,
                    device_function_id: a.device_function_id,
                    action_type: a.action_type.as_str().to_owned(),
                    payload_template: a.payload_template,
                    active: a.active,
                })
                .collect(),
        })
        .collect();

    let translations = detailed
        .translations
        .into_iter()
        .map(|t| TranslationResponse {
            locale: t.locale,
            name: t.name,
            description: t.description,
        })
        .collect();

    Ok(Json(DeviceDetailedResponse {
        id: detailed.id,
        code: detailed.code,
        device_category_id: detailed.device_category_id,
        status: detailed.status.as_str().to_owned(),
        serial_number: detailed.serial_number,
        firmware_version: detailed.firmware_version,
        active: detailed.active,
        is_moderated: detailed.is_moderated,
        last_seen_at: detailed.last_seen_at,
        functions,
        translations,
    }))
}

async fn get_device_by_code(
    State(s): State<DevicesState>,
    Path(code): Path<String>,
) -> Result<Json<DeviceResponse>, AppError> {
    let device = s
        .repo
        .find_by_code(&code)
        .await?
        .ok_or_else(|| local_server_application::DomainError::not_found("device", &code))?;
    Ok(Json(DeviceResponse::from(device)))
}

#[utoipa::path(post, path = "/api/v1/devices",
    request_body = CreateDeviceBody,
    responses((status = 201, body = DeviceResponse)),
    tag = "devices")]
async fn create_device(
    State(s): State<DevicesState>,
    Json(body): Json<CreateDeviceBody>,
) -> Result<(StatusCode, Json<DeviceResponse>), AppError> {
    let device = s
        .repo
        .create(CreateDeviceCmd {
            code: body.code,
            device_category_id: body.device_category_id,
            status: body.status.unwrap_or_default(),
            serial_number: body.serial_number,
            firmware_version: body.firmware_version,
            active: body.active,
            is_moderated: body.is_moderated,
        })
        .await?;
    Ok((StatusCode::CREATED, Json(DeviceResponse::from(device))))
}

async fn update_device(
    State(s): State<DevicesState>,
    Path(id): Path<i64>,
    Json(body): Json<UpdateDeviceBody>,
) -> Result<Json<DeviceResponse>, AppError> {
    let device = s
        .repo
        .update(
            id,
            UpdateDeviceCmd {
                code: body.code,
                device_category_id: body.device_category_id,
                status: body.status.unwrap_or_default(),
                serial_number: body.serial_number,
                firmware_version: body.firmware_version,
                active: body.active,
            },
        )
        .await?;
    Ok(Json(DeviceResponse::from(device)))
}

async fn soft_delete_device(
    State(s): State<DevicesState>,
    Path(id): Path<i64>,
) -> Result<StatusCode, AppError> {
    s.repo.soft_delete(id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(patch, path = "/api/v1/devices/{id}/status",
    params(
        ("id" = i64, Path, description = "Device ID"),
        ("status" = String, Query, description = "ONLINE or OFFLINE"),
    ),
    responses((status = 200, body = DeviceResponse)),
    tag = "devices")]
async fn update_device_status(
    State(s): State<DevicesState>,
    Path(id): Path<i64>,
    Query(q): Query<StatusQuery>,
) -> Result<Json<DeviceResponse>, AppError> {
    let device = s.repo.update_status(id, q.status).await?;
    Ok(Json(DeviceResponse::from(device)))
}

async fn list_functions_by_device(
    State(s): State<DevicesState>,
    Path(device_id): Path<i64>,
) -> Result<Json<Vec<DeviceFunctionResponse>>, AppError> {
    let fns = s.repo.find_functions_by_device(device_id).await?;
    Ok(Json(fns.into_iter().map(DeviceFunctionResponse::from).collect()))
}

#[utoipa::path(patch, path = "/api/v1/device-functions/{id}/value",
    request_body = UpdateValueBody,
    responses((status = 200, body = DeviceFunctionResponse)),
    tag = "device-functions")]
async fn update_function_value(
    State(s): State<DevicesState>,
    Path(id): Path<i64>,
    Json(body): Json<UpdateValueBody>,
) -> Result<Json<DeviceFunctionResponse>, AppError> {
    let func = s.repo.update_function_value(id, &body.value).await?;
    Ok(Json(DeviceFunctionResponse::from(func)))
}