use std::sync::Arc;

use local_server_application::ports::HealthChecker;

/// State shared across HTTP route handlers.
///
/// Holds *only* `application`-layer trait objects so the inbound adapters
/// stay decoupled from concrete persistence/IO crates. The gateway crate is
/// responsible for constructing this with the correct adapters at startup.
#[derive(Clone)]
pub struct HttpAppState {
    /// Reported in `GET /api/v1/system/health`. Set this from
    /// `env!("CARGO_PKG_VERSION")` at the binary level.
    pub version: &'static str,
    /// Liveness probe across infra dependencies (DB at LS-001).
    pub health: Arc<dyn HealthChecker>,
}
