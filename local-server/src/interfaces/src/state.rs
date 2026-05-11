use std::sync::Arc;

use local_server_application::ports::{
    AccessSyncRepository, CloudAuthClient, CloudSyncClient, HealthChecker, MqttClient,
    RuntimeSettingsRepository,
};

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
    /// Mutable runtime settings persisted in local DB.
    pub runtime_settings: Arc<dyn RuntimeSettingsRepository>,
    /// Runtime MQTT adapter that can be reconfigured without restart.
    pub mqtt: Arc<dyn MqttClient>,
    /// Outbound client for access-service device auth flow.
    pub cloud_auth: Arc<dyn CloudAuthClient>,
    /// Outbound HTTP client that fetches data from access-service for sync.
    pub cloud_sync: Arc<dyn CloudSyncClient>,
    /// Repository for storing and querying access-service data locally.
    pub access_sync: Arc<dyn AccessSyncRepository>,
    /// Fallback access-service URL from process config.
    pub default_access_service_url: String,
    /// Optional externally reachable base URL for callback flow.
    pub public_base_url: Option<String>,
}
