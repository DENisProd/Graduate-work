use std::sync::Arc;

use axum::Router;
use local_server_application::ports::{DeviceRepository, MqttClient, PhysicalDeviceRepository, ZigbeeRepository};
use serde::Serialize;
use tower_http::trace::TraceLayer;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::HttpAppState;

pub mod device_categories;
pub mod devices;
pub mod error;
pub mod physical_devices;
pub mod system;
pub mod zigbee;

// ─── Shared pagination wrapper ────────────────────────────────────────────────

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageResponse<T: Serialize> {
    pub content: Vec<T>,
    pub page: i64,
    pub size: i64,
    pub total_elements: i64,
    pub total_pages: i64,
    pub first: bool,
    pub last: bool,
    pub has_next: bool,
    pub has_previous: bool,
}

impl<T: Serialize> PageResponse<T> {
    pub fn from_result(content: Vec<T>, total_elements: i64, page: i64, size: i64) -> Self {
        let total_pages = if size > 0 { (total_elements + size - 1) / size } else { 0 };
        let first = page == 0;
        let last = total_pages == 0 || page >= total_pages - 1;
        Self {
            has_next: !last,
            has_previous: !first,
            total_pages,
            first,
            last,
            content,
            page,
            size,
            total_elements,
        }
    }
}

// ─── OpenAPI spec ─────────────────────────────────────────────────────────────

#[derive(OpenApi)]
#[openapi(
    paths(
        system::health,
        devices::list_devices,
        devices::get_device,
        devices::create_device,
        devices::update_device_status,
        devices::update_function_value,
        device_categories::list_all_categories,
        device_categories::list_all_types,
        physical_devices::list_physical_devices,
        physical_devices::create_physical_device,
    ),
    components(schemas(
        system::HealthResponse,
        devices::DeviceResponse,
        devices::DeviceDetailedResponse,
        devices::DeviceFunctionResponse,
        devices::DeviceFunctionActionResponse,
        devices::TranslationResponse,
        devices::CreateDeviceBody,
        devices::UpdateDeviceBody,
        devices::UpdateValueBody,
        device_categories::DeviceCategoryResponse,
        device_categories::DeviceTypeResponse,
        physical_devices::PhysicalDeviceResponse,
        physical_devices::CreatePhysicalDeviceBody,
        physical_devices::UpdatePhysicalDeviceBody,
    )),
    info(
        title = "Local Server API",
        version = "0.1.0",
        description = "Smart Home local-server REST API"
    )
)]
struct ApiDoc;

// ─── Router ───────────────────────────────────────────────────────────────────

/// Build the full HTTP-only axum router (no Socket.IO layer).
///
/// To add the WebSocket layer, call `crate::websocket::apply_to_router` on
/// the result.  Swagger UI: `GET /docs`.
pub fn router(
    http_state: HttpAppState,
    device_repo: Arc<dyn DeviceRepository>,
    phys_repo: Arc<dyn PhysicalDeviceRepository>,
    zigbee_repo: Arc<dyn ZigbeeRepository>,
    mqtt_client: Option<Arc<dyn MqttClient>>,
    mqtt_prefix: String,
) -> Router {
    Router::new()
        .nest(
            "/api/v1",
            Router::new()
                .merge(system::router(http_state))
                .merge(devices::router(device_repo.clone()))
                .merge(device_categories::router(device_repo))
                .merge(physical_devices::router(phys_repo))
                .merge(zigbee::router(zigbee_repo, mqtt_client, mqtt_prefix)),
        )
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .layer(TraceLayer::new_for_http())
}
