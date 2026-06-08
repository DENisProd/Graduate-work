use async_trait::async_trait;
use local_server_application::ports::{HealthChecker, HealthError};

use super::local_data_reset::reset_local_data;
use sqlx::SqlitePool;

#[derive(Debug, Clone)]
pub struct SqliteHealthChecker {
    pool: SqlitePool,
}

impl SqliteHealthChecker {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl HealthChecker for SqliteHealthChecker {
    async fn check_db(&self) -> Result<(), HealthError> {
        sqlx::query_scalar::<_, i64>("SELECT 1")
            .fetch_one(&self.pool)
            .await
            .map(|_| ())
            .map_err(|e| HealthError::Database(e.to_string()))
    }

    async fn reset_local_data(&self) -> Result<(), HealthError> {
        reset_local_data(&self.pool)
            .await
            .map_err(|e| HealthError::Database(e.to_string()))
    }
}