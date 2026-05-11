//! End-to-end smoke test for `GET /api/v1/system/health`.
//!
//! Wires the same components as `main.rs` against an in-memory SQLite pool —
//! migrations run, the request goes through the full router stack, and the
//! response shape is verified.

use std::sync::Arc;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use local_server_application::ports::{
    AuthPollResult, AuthSessionStartResult, CloudAuthClient, CompleteAuthArgs, DeviceRepository,
    HealthChecker, MqttClient, PhysicalDeviceRepository, RuntimeSettings,
    RuntimeSettingsRepository, ScenarioExecutionRepository, ScenarioRepository, ZigbeeRepository,
};
use local_server_application::services::{ScenarioEngine, ZigbeeRealtimeService};
use local_server_application::DomainError;
use local_server_infrastructure::persistence::{
    init_pool, OutboxWriter, SqliteDeviceRepo, SqliteHealthChecker, SqlitePhysicalDeviceRepo,
    SqliteScenarioExecutionRepo, SqliteScenarioRepo, SqliteZigbeeRepo, SqlitePoolConfig,
};
use local_server_interfaces::{http, HttpAppState};
use serde_json::Value;
use tower::ServiceExt;
use async_trait::async_trait;

#[derive(Default)]
struct NoopSettingsRepo;

#[async_trait]
impl RuntimeSettingsRepository for NoopSettingsRepo {
    async fn load(&self) -> Result<RuntimeSettings, DomainError> {
        Ok(RuntimeSettings::default())
    }
    async fn set_mqtt_gateway_url(&self, _value: Option<&str>) -> Result<(), DomainError> {
        Ok(())
    }
    async fn set_access_service_url(&self, _value: Option<&str>) -> Result<(), DomainError> {
        Ok(())
    }
    async fn save_auth_session(
        &self,
        _session_id: &str,
        _status: &str,
        _auth_code: Option<&str>,
        _external_user_id: Option<&str>,
        _display_name: Option<&str>,
        _expires_at: Option<&str>,
    ) -> Result<(), DomainError> {
        Ok(())
    }

    async fn clear_auth_session(&self) -> Result<(), DomainError> {
        Ok(())
    }
}

#[derive(Default)]
struct NoopCloudAuth;

#[async_trait]
impl CloudAuthClient for NoopCloudAuth {
    async fn start_session(
        &self,
        _access_service_url: &str,
        _callback_url: Option<&str>,
    ) -> Result<AuthSessionStartResult, DomainError> {
        Err(DomainError::DependencyUnavailable("not used in health test".into()))
    }
    async fn poll_session(
        &self,
        _access_service_url: &str,
        _session_id: &str,
    ) -> Result<AuthPollResult, DomainError> {
        Err(DomainError::DependencyUnavailable("not used in health test".into()))
    }
    async fn complete_session(
        &self,
        _access_service_url: &str,
        _args: CompleteAuthArgs,
    ) -> Result<(), DomainError> {
        Err(DomainError::DependencyUnavailable("not used in health test".into()))
    }

    async fn logout_session(
        &self,
        _access_service_url: &str,
        _session_id: &str,
    ) -> Result<(), DomainError> {
        Err(DomainError::DependencyUnavailable("not used in health test".into()))
    }
}

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
    async fn reconfigure(&self, _mqtt_url: Option<&str>) -> Result<(), DomainError> {
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
        runtime_settings: Arc::new(NoopSettingsRepo) as Arc<dyn RuntimeSettingsRepository>,
        mqtt: Arc::new(NoopMqtt) as Arc<dyn MqttClient>,
        cloud_auth: Arc::new(NoopCloudAuth) as Arc<dyn CloudAuthClient>,
        default_access_service_url: "http://localhost:8085".to_string(),
        public_base_url: None,
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
