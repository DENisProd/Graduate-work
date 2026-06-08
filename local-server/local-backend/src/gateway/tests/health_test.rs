//! End-to-end smoke test for `GET /api/v1/system/health`.
//!
//! Wires the same components as `main.rs` against an in-memory SQLite pool —
//! migrations run, the request goes through the full router stack, and the
//! response shape is verified.

use std::sync::Arc;

use async_trait::async_trait;
use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use local_server_application::ports::{
    AccessRepository, DeviceRepository, HealthChecker, ModbusBridgePort, ModbusRepository,
    MqttClient, PhysicalDeviceRepository, RuntimeSettingsRepository,
    ScenarioExecutionRepository, ScenarioRepository, WidgetDashboardRepository, ZigbeeRepository,
};
use local_server_application::services::{AccessEvaluator, ScenarioEngine, ZigbeeRealtimeService};
use local_server_application::DomainError;
use local_server_core::entities::scan_log::new_scan_log;
use local_server_infrastructure::persistence::{
    init_pool, OutboxWriter, SqliteAccessRepo, SqliteAccessSyncRepo, SqliteDeviceRepo,
    SqliteHealthChecker, SqliteModbusRepo, SqlitePhysicalDeviceRepo,
    SqliteRuntimeSettingsRepo, SqliteScenarioExecutionRepo, SqliteScenarioRepo,
    SqliteWidgetDashboardRepo, SqliteZigbeeRepo, SqlitePoolConfig,
};
use local_server_infrastructure::{
    ModbusGateway, ReqwestCloudAuthClient, ReqwestCloudScenarioClient, ReqwestCloudSyncClient,
    ReqwestCloudWidgetDashboardClient,
};
use local_server_interfaces::{http, HttpAppState};
use serde_json::Value;
use tower::ServiceExt;

#[derive(Default)]
struct NoopMqtt;

#[async_trait]
impl MqttClient for NoopMqtt {
    async fn publish(&self, _topic: &str, _payload: &[u8]) -> Result<(), DomainError> {
        Err(DomainError::DependencyUnavailable("MQTT not configured".into()))
    }
    async fn is_connected(&self) -> bool {
        false
    }
    async fn current_url(&self) -> Option<String> {
        None
    }
    async fn reconfigure(
        &self,
        _config: Option<local_server_application::ports::MqttConnectConfig>,
    ) -> Result<(), DomainError> {
        Ok(())
    }
}

#[tokio::test]
async fn health_endpoint_reports_db_ok() {
    let pool = init_pool(&SqlitePoolConfig {
        url: "sqlite::memory:".into(),
        max_connections: 1,
        busy_timeout_ms: 1_000,
    })
    .await
    .expect("init in-memory SQLite pool");

    let outbox = Arc::new(OutboxWriter::new());
    let device_repo = Arc::new(SqliteDeviceRepo::new(pool.clone(), outbox.clone()))
        as Arc<dyn DeviceRepository>;
    let phys_repo = Arc::new(SqlitePhysicalDeviceRepo::new(pool.clone(), outbox))
        as Arc<dyn PhysicalDeviceRepository>;
    let zigbee_repo =
        Arc::new(SqliteZigbeeRepo::new(pool.clone())) as Arc<dyn ZigbeeRepository>;
    let scenario_repo =
        Arc::new(SqliteScenarioRepo::new(pool.clone())) as Arc<dyn ScenarioRepository>;
    let scenario_exec_repo = Arc::new(SqliteScenarioExecutionRepo::new(pool.clone()))
        as Arc<dyn ScenarioExecutionRepository>;
    let runtime_settings_repo = Arc::new(SqliteRuntimeSettingsRepo::new(pool.clone()))
        as Arc<dyn RuntimeSettingsRepository>;
    let access_sync_repo = Arc::new(SqliteAccessSyncRepo::new(pool.clone()))
        as _;
    let access_repo = Arc::new(SqliteAccessRepo::new(pool.clone())) as Arc<dyn AccessRepository>;
    let access_evaluator = Arc::new(AccessEvaluator::new(access_repo.clone()));
    let widget_dashboard_repo = Arc::new(SqliteWidgetDashboardRepo::new(pool.clone()))
        as Arc<dyn WidgetDashboardRepository>;
    let modbus_repo = Arc::new(SqliteModbusRepo::new(pool.clone())) as Arc<dyn ModbusRepository>;
    let modbus_bridge = Arc::new(ModbusGateway::new()) as Arc<dyn ModbusBridgePort>;
    let realtime = Arc::new(ZigbeeRealtimeService::new());
    let scenario_engine = Arc::new(
        ScenarioEngine::new(
            scenario_repo.clone(),
            scenario_exec_repo.clone(),
            None,
            realtime,
            zigbee_repo.clone(),
            phys_repo.clone(),
            "zigbee2mqtt".to_string(),
        )
        .await
        .expect("init scenario engine"),
    );

    let state = HttpAppState {
        version: "0.1.0",
        health: Arc::new(SqliteHealthChecker::new(pool)) as Arc<dyn HealthChecker>,
        runtime_settings: runtime_settings_repo.clone(),
        mqtt: Arc::new(NoopMqtt) as Arc<dyn MqttClient>,
        cloud_auth: Arc::new(ReqwestCloudAuthClient::new()),
        cloud_sync: Arc::new(ReqwestCloudSyncClient::with_settings(
            String::new(),
            runtime_settings_repo.clone(),
        )),
        access_sync: access_sync_repo,
        default_access_service_url: "http://localhost:8085".to_string(),
        default_cloud_sync_url: "http://localhost:8082".to_string(),
        configured_mqtt_url: None,
        default_mqtt_username: None,
        default_mqtt_password: None,
        public_base_url: None,
        cloud_scenario: Arc::new(ReqwestCloudScenarioClient::with_settings(
            String::new(),
            runtime_settings_repo.clone(),
        )),
        cloud_widget_dashboard: Arc::new(ReqwestCloudWidgetDashboardClient::new()),
        scenario_repo: scenario_repo.clone(),
        widget_dashboard_repo: widget_dashboard_repo.clone(),
        scenario_service_url: "http://localhost:3001".to_string(),
        serial_number: None,
    };

    let response = http::router(
        state,
        device_repo,
        phys_repo,
        zigbee_repo,
        Arc::new(NoopMqtt),
        String::new(),
        scenario_repo,
        scenario_exec_repo,
        scenario_engine,
        access_repo,
        access_evaluator,
        widget_dashboard_repo,
        modbus_repo,
        modbus_bridge,
        new_scan_log(),
    )
    .oneshot(
        Request::builder()
            .uri("/api/v1/system/health")
            .body(Body::empty())
            .unwrap(),
    )
    .await
    .expect("router service call");

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: Value = serde_json::from_slice(&body).expect("valid JSON body");

    assert_eq!(json["status"], "ok");
    assert_eq!(json["version"], "0.1.0");
    assert_eq!(json["db"], "ok");
}
