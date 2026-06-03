use std::path::Path;
use std::str::FromStr;

use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};
use sqlx::SqlitePool;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum PoolError {
    #[error("invalid SQLite url: {0}")]
    InvalidUrl(String),
    #[error("failed to create SQLite directory: {0}")]
    CreateDir(#[from] std::io::Error),
    #[error("connection failed: {0}")]
    Connect(#[source] sqlx::Error),
    #[error("migration failed: {0}")]
    Migrate(#[from] sqlx::migrate::MigrateError),
}

#[derive(Debug, Clone)]
pub struct SqlitePoolConfig {
    pub url: String,
    pub max_connections: u32,
    pub busy_timeout_ms: u32,
}

impl Default for SqlitePoolConfig {
    fn default() -> Self {
        Self {
            url: "sqlite:./local.db".into(),
            max_connections: 5,
            busy_timeout_ms: 5_000,
        }
    }
}

pub async fn init_pool(cfg: &SqlitePoolConfig) -> Result<SqlitePool, PoolError> {
    let connect_opts = build_connect_opts(&cfg.url, cfg.busy_timeout_ms)?;

    let pool = SqlitePoolOptions::new()
        .max_connections(cfg.max_connections)
        .connect_with(connect_opts)
        .await
        .map_err(PoolError::Connect)?;

    MIGRATOR.run(&pool).await?;
    Ok(pool)
}

pub static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../../migrations");

fn build_connect_opts(url: &str, busy_timeout_ms: u32) -> Result<SqliteConnectOptions, PoolError> {
    let opts = SqliteConnectOptions::from_str(url)
        .map_err(|e| PoolError::InvalidUrl(e.to_string()))?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .foreign_keys(true)
        .busy_timeout(std::time::Duration::from_millis(busy_timeout_ms.into()));

    if let Some(parent) = sqlite_file_parent(url) {
        std::fs::create_dir_all(parent)?;
    }

    Ok(opts)
}

fn sqlite_file_parent(url: &str) -> Option<&Path> {
    let path = url.strip_prefix("sqlite://").or_else(|| url.strip_prefix("sqlite:"))?;
    if path.is_empty() || path.starts_with(':') {
        return None;
    }
    Path::new(path).parent().filter(|p| !p.as_os_str().is_empty())
}