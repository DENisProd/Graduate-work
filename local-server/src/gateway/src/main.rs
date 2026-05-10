use std::sync::Arc;
use std::time::Duration;

use anyhow::Context;
use local_server_application::ports::MqttClient;
use local_server_application::services::ScenarioEngine;
use local_server_infrastructure::persistence::{init_pool, SqlitePoolConfig};
use local_server_infrastructure::{run_ingestion, RumqttcClient};
use local_server_interfaces::{http, websocket};
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

    // Load `.env` for local development. This is a no-op in environments where
    // the file is absent (e.g. Docker/prod), and env vars still take precedence.
    let _ = dotenvy::dotenv();

    let cfg = Config::from_env().context("loading configuration")?;
    tracing::info!(
        port = cfg.port,
        database_url = %cfg.database_url,
        mqtt_url = ?cfg.mqtt_url,
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

    // Optional MQTT client + ingestion loop
    let mqtt_client: Option<Arc<dyn MqttClient>> = match &cfg.mqtt_url {
        Some(url) => {
            match RumqttcClient::connect(url, &cfg.mqtt_topic_prefix).await {
                Ok(client) => {
                    let rx = client.message_receiver();
                    tokio::spawn(run_ingestion(
                        rx,
                        state.zigbee_repo.clone(),
                        state.realtime_svc.clone(),
                        cfg.mqtt_topic_prefix.clone(),
                    ));
                    Some(client as Arc<dyn MqttClient>)
                }
                Err(e) => {
                    tracing::warn!(error = %e, "MQTT unavailable, continuing without it");
                    None
                }
            }
        }
        None => {
            tracing::info!("MQTT not configured (set ZIGBEE_MQTT_URL to enable)");
            None
        }
    };

    // Scenario engine
    let scenario_engine = Arc::new(
        ScenarioEngine::new(
            state.scenario_repo.clone(),
            state.scenario_exec_repo.clone(),
            mqtt_client.clone(),
            state.realtime_svc.clone(),
            state.zigbee_repo.clone(),
            state.phys_repo.clone(),
            cfg.mqtt_topic_prefix.clone(),
        )
        .await
        .context("initialising scenario engine")?,
    );

    scenario_engine
        .load_and_start()
        .await
        .context("loading scenarios")?;

    // Build HTTP router then wrap with Socket.IO layer
    let http_router = http::router(
        state.http_state(VERSION),
        state.device_repo.clone(),
        state.phys_repo.clone(),
        state.zigbee_repo.clone(),
        mqtt_client.clone(),
        cfg.mqtt_topic_prefix.clone(),
        state.scenario_repo.clone(),
        state.scenario_exec_repo.clone(),
        scenario_engine,
    );

    let app = websocket::apply_to_router(
        http_router,
        mqtt_client,
        state.zigbee_repo.clone(),
        state.realtime_svc.clone(),
        cfg.mqtt_topic_prefix.clone(),
    );

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

async fn enforce_shutdown_deadline(deadline: Duration) {
    shutdown_signal().await;
    tokio::time::sleep(deadline).await;
}
