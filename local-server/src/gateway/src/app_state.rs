use std::sync::Arc;

use local_server_application::{
    ports::{DeviceRepository, HealthChecker, PhysicalDeviceRepository, ZigbeeRepository},
    services::ZigbeeRealtimeService,
};
use local_server_infrastructure::persistence::{
    OutboxWriter, SqliteDeviceRepo, SqliteHealthChecker, SqlitePhysicalDeviceRepo, SqliteZigbeeRepo,
};
use local_server_infrastructure::SqlitePool;
use local_server_interfaces::HttpAppState;

/// Owns all concrete adapters for the lifetime of the process.
pub struct AppState {
    #[allow(dead_code)]
    pub pool: SqlitePool,
    pub health: Arc<dyn HealthChecker>,
    pub device_repo: Arc<dyn DeviceRepository>,
    pub phys_repo: Arc<dyn PhysicalDeviceRepository>,
    pub zigbee_repo: Arc<dyn ZigbeeRepository>,
    pub realtime_svc: Arc<ZigbeeRealtimeService>,
}

impl AppState {
    pub fn new(pool: SqlitePool) -> Self {
        let outbox = Arc::new(OutboxWriter::new());

        let health = Arc::new(SqliteHealthChecker::new(pool.clone())) as Arc<dyn HealthChecker>;

        let device_repo = Arc::new(SqliteDeviceRepo::new(pool.clone(), outbox.clone()))
            as Arc<dyn DeviceRepository>;

        let phys_repo = Arc::new(SqlitePhysicalDeviceRepo::new(pool.clone(), outbox))
            as Arc<dyn PhysicalDeviceRepository>;

        let zigbee_repo =
            Arc::new(SqliteZigbeeRepo::new(pool.clone())) as Arc<dyn ZigbeeRepository>;

        let realtime_svc = Arc::new(ZigbeeRealtimeService::new());

        Self { pool, health, device_repo, phys_repo, zigbee_repo, realtime_svc }
    }

    pub fn http_state(&self, version: &'static str) -> HttpAppState {
        HttpAppState { version, health: self.health.clone() }
    }
}
