use std::sync::Arc;

use local_server_application::ports::HealthChecker;
use local_server_infrastructure::persistence::SqliteHealthChecker;
use local_server_infrastructure::SqlitePool;
use local_server_interfaces::HttpAppState;

/// Owns concrete adapters for the lifetime of the process.
///
/// Built once in `main`, then projected into shape-specific states
/// (`HttpAppState`, websocket state, …) for inbound adapters.
pub struct AppState {
    // Held by `AppState` so the pool's lifetime matches the process and
    // future repository adapters (LS-002+) can clone it from here.
    #[allow(dead_code)]
    pub pool: SqlitePool,
    pub health: Arc<dyn HealthChecker>,
}

impl AppState {
    pub fn new(pool: SqlitePool) -> Self {
        let health = Arc::new(SqliteHealthChecker::new(pool.clone())) as Arc<dyn HealthChecker>;
        Self { pool, health }
    }

    pub fn http_state(&self, version: &'static str) -> HttpAppState {
        HttpAppState {
            version,
            health: self.health.clone(),
        }
    }
}
