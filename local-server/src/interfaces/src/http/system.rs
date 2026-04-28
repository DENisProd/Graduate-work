use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;

use crate::HttpAppState;

/// `GET /system/health` — liveness probe used by load balancers, the OTA
/// applier, and the integration test in `tests/health_test.rs`.
///
/// Mounted under `/api/v1` by `http::router`.
pub fn router(state: HttpAppState) -> Router {
    Router::new()
        .route("/system/health", get(health))
        .with_state(state)
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
    db: &'static str,
}

async fn health(State(state): State<HttpAppState>) -> Json<HealthResponse> {
    let db = match state.health.check_db().await {
        Ok(()) => "ok",
        Err(err) => {
            tracing::warn!(error = %err, "db health probe failed");
            "error"
        }
    };

    Json(HealthResponse {
        status: "ok",
        version: state.version,
        db,
    })
}
