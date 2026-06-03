use std::sync::Arc;

use axum::Router;
use axum::http::{header, HeaderName, HeaderValue, Method};
use local_server_application::{
    ports::{
        AccessRepository, DeviceRepository, ModbusBridgePort, ModbusRepository, MqttClient,
        PhysicalDeviceRepository, WidgetDashboardRepository, ZigbeeRepository,
        scenario_repository::ScenarioExecutionRepository,
    },
    services::{AccessEvaluator, ScenarioEngine},
};
use local_server_application::ports::ScenarioRepository;
use local_server_core::entities::scan_log::ScanLog;
use serde::Serialize;
use tower_http::classify::ServerErrorsFailureClass;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::HttpAppState;

pub mod access;
pub mod device_categories;
pub mod devices;
pub mod error;
pub mod physical_devices;
pub mod scenario_executions;
pub mod scenarios;
pub mod system;
pub mod modbus;
pub mod widget_dashboards;
pub mod zigbee;

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

#[allow(clippy::too_many_arguments)]
pub fn router(
    http_state: HttpAppState,
    device_repo: Arc<dyn DeviceRepository>,
    phys_repo: Arc<dyn PhysicalDeviceRepository>,
    zigbee_repo: Arc<dyn ZigbeeRepository>,
    mqtt_client: Arc<dyn MqttClient>,
    mqtt_prefix: String,
    scenario_repo: Arc<dyn ScenarioRepository>,
    scenario_exec_repo: Arc<dyn ScenarioExecutionRepository>,
    scenario_engine: Arc<ScenarioEngine>,
    access_repo: Arc<dyn AccessRepository>,
    evaluator: Arc<AccessEvaluator>,
    widget_dashboard_repo: Arc<dyn WidgetDashboardRepository>,
    modbus_repo: Arc<dyn ModbusRepository>,
    modbus_gateway: Arc<dyn ModbusBridgePort>,
    scan_log: ScanLog,
) -> Router {
    let cors = build_cors_layer();
    Router::new()
        .nest(
            "/api/v1",
            Router::new()
                .merge(system::router(http_state))
                .merge(devices::router(device_repo.clone()))
                .merge(device_categories::router(device_repo))
                .merge(physical_devices::router(phys_repo.clone()))
                .merge(zigbee::router(zigbee_repo, phys_repo, mqtt_client.clone(), mqtt_prefix))
                .merge(scenarios::router(
                    scenario_repo,
                    scenario_exec_repo.clone(),
                    scenario_engine.clone(),
                ))
                .merge(scenario_executions::router(scenario_exec_repo, scenario_engine))
                .merge(access::router(access_repo, evaluator))
                .merge(widget_dashboards::router(widget_dashboard_repo))
                .merge(modbus::router(modbus_repo, modbus_gateway, mqtt_client, scan_log)),
        )
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(|req: &axum::http::Request<axum::body::Body>| {
                    tracing::info_span!(
                        "http_request",
                        method = %req.method(),
                        uri = %req.uri(),
                    )
                })
                .on_failure(
                    |err: ServerErrorsFailureClass,
                     latency: std::time::Duration,
                     span: &tracing::Span| {
                        let _enter = span.enter();
                        tracing::error!(
                            classification = %err,
                            latency = ?latency,
                            "response failed",
                        );
                    },
                ),
        )
        .layer(cors)
}

fn cors_origins_from_env() -> Vec<String> {
    let raw = std::env::var("LOCAL_SERVER_CORS_ORIGINS")
        .or_else(|_| std::env::var("FRONTEND_ORIGIN"))
        .unwrap_or_default();

    let parts: Vec<String> = raw
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if parts.is_empty() {
        vec![
            "http://localhost:5173".to_string(),
            "http://127.0.0.1:5173".to_string(),
            "http://localhost:3000".to_string(),
            "http://127.0.0.1:3000".to_string(),
        ]
    } else {
        parts
    }
}

fn build_cors_layer() -> CorsLayer {
    let origins = cors_origins_from_env();

    let mut layer = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::CONTENT_TYPE,
            header::ACCEPT,
            header::AUTHORIZATION,
            HeaderName::from_static("x-user-id"),
            HeaderName::from_static("x-requested-with"),
        ]);

    if origins.iter().any(|o| o == "*") {
        layer = layer.allow_origin(tower_http::cors::Any);
    } else {
        let values = origins
            .into_iter()
            .filter_map(|o| HeaderValue::from_str(&o).ok())
            .collect::<Vec<_>>();
        layer = layer.allow_origin(AllowOrigin::list(values));
    }

    layer
}