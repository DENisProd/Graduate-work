use async_trait::async_trait;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum HealthError {
    #[error("database probe failed: {0}")]
    Database(String),
}

#[async_trait]
pub trait HealthChecker: Send + Sync {
    async fn check_db(&self) -> Result<(), HealthError>;
    async fn reset_local_data(&self) -> Result<(), HealthError>;
}