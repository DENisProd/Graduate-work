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
    DeviceRepository, HealthChecker, PhysicalDeviceRepository, ZigbeeRepository,
};
use local_server_infrastructure::persistence::{
    init_pool, OutboxWriter, SqliteDeviceRepo, SqliteHealthChecker, SqlitePhysicalDeviceRepo,
    SqliteZigbeeRepo, SqlitePoolConfig,
};
use local_server_interfaces::{http, HttpAppState};
use serde_json::Value;
use tower::ServiceExt;

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

    let state = HttpAppState {
        version: "0.1.0",
        health: Arc::new(SqliteHealthChecker::new(pool)) as Arc<dyn HealthChecker>,
    };

    let response = http::router(
        state,
        device_repo,
        phys_repo,
        zigbee_repo,
        None,
        String::new(),
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
