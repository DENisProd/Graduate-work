use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;
use utoipa::ToSchema;

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

#[derive(Debug, Serialize, ToSchema)]
pub struct HealthResponse {
    /// Overall service status. Always `"ok"` when the handler is reachable.
    status: &'static str,
    /// Semver version of the running binary.
    version: &'static str,
    /// SQLite connectivity: `"ok"` or `"error"`.
    db: &'static str,
}

#[utoipa::path(
    get,
    path = "/api/v1/system/health",
    responses(
        (status = 200, description = "Service is alive", body = HealthResponse)
    ),
    tag = "system"
)]
pub async fn health(State(state): State<HttpAppState>) -> Json<HealthResponse> {
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
