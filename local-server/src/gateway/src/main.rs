use std::time::Duration;

use anyhow::Context;
use local_server_infrastructure::persistence::{init_pool, SqlitePoolConfig};
use local_server_interfaces::http;
use tokio::net::TcpListener;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

mod app_state;
mod config;

use app_state::AppState;
use config::Config;

const VERSION: &str = env!("CARGO_PKG_VERSION");

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    init_tracing();

    let cfg = Config::from_env().context("loading configuration")?;
    tracing::info!(
        port = cfg.port,
        database_url = %cfg.database_url,
        version = VERSION,
        "starting local-server",
    );

    let pool = init_pool(&SqlitePoolConfig {
        url: cfg.database_url.clone(),
        max_connections: cfg.max_db_connections,
        busy_timeout_ms: cfg.busy_timeout_ms,
    })
    .await
    .context("initialising SQLite pool")?;

    let state = AppState::new(pool);
    let app = http::router(state.http_state(VERSION));

    let listener = TcpListener::bind(("0.0.0.0", cfg.port))
        .await
        .with_context(|| format!("binding TCP listener on :{}", cfg.port))?;
    tracing::info!(port = cfg.port, version = VERSION, "server listening");

    let shutdown_deadline = Duration::from_secs(cfg.graceful_shutdown_secs);
    let server = axum::serve(listener, app).with_graceful_shutdown(shutdown_signal());

    tokio::select! {
        res = server => res.context("axum serve")?,
        _ = enforce_shutdown_deadline(shutdown_deadline) => {
            tracing::warn!(
                deadline_secs = shutdown_deadline.as_secs(),
                "graceful shutdown deadline exceeded; aborting in-flight requests",
            );
        }
    }

    tracing::info!("shutdown complete");
    Ok(())
}

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().json().with_current_span(false))
        .init();
}

/// Resolves on the first received `Ctrl+C` (Windows + Unix) or `SIGTERM`
/// (Unix only). Used as the graceful-shutdown trigger for `axum::serve`.
async fn shutdown_signal() {
    let ctrl_c = async {
        if let Err(err) = tokio::signal::ctrl_c().await {
            tracing::error!(error = %err, "failed to install Ctrl+C handler");
        }
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut sig) => {
                sig.recv().await;
            }
            Err(err) => {
                tracing::error!(error = %err, "failed to install SIGTERM handler");
                std::future::pending::<()>().await;
            }
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => tracing::info!("received Ctrl+C, shutting down"),
        _ = terminate => tracing::info!("received SIGTERM, shutting down"),
    }
}

/// Caps graceful shutdown at `deadline` measured from when the shutdown
/// signal first fires. Keeps `axum::serve(...).with_graceful_shutdown(...)`
/// from hanging indefinitely on stuck in-flight requests.
async fn enforce_shutdown_deadline(deadline: Duration) {
    shutdown_signal().await;
    tokio::time::sleep(deadline).await;
}
