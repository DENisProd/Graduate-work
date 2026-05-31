use async_trait::async_trait;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum HealthError {
    #[error("database probe failed: {0}")]
    Database(String),
}

/// Probes infrastructure dependencies (DB, brokers, …) for liveness.
///
/// Implementations live in `infrastructure`. The `interfaces::http::system`
/// handler depends on this trait, not on a concrete pool, which keeps the
/// HTTP layer free of `sqlx`.
#[async_trait]
pub trait HealthChecker: Send + Sync {
    async fn check_db(&self) -> Result<(), HealthError>;
}
