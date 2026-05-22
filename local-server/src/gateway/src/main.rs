use std::sync::Arc;
use std::time::Duration;

use anyhow::Context;
use local_server_application::ports::{MqttClient, RuntimeSettingsRepository};
use local_server_application::services::{
    run_delta_puller, run_outbox_pusher, run_physical_device_sync, run_scenario_sync,
    run_widget_dashboard_sync, CloudSyncUrlProvider, ScenarioEngine, UserIdProvider,
};
use local_server_infrastructure::persistence::{init_pool, SqlitePoolConfig};
use local_server_interfaces::{http, websocket};
use tokio::net::TcpListener;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

mod app_state;
mod config;
mod mqtt_manager;

use app_state::AppState;
use config::Config;

const VERSION: &str = env!("CARGO_PKG_VERSION");

struct RuntimeSettingsUserIdProvider {
    settings: Arc<dyn RuntimeSettingsRepository>,
}

#[async_trait::async_trait]
impl UserIdProvider for RuntimeSettingsUserIdProvider {
    async fn get(&self) -> Option<String> {
        self.settings.load().await.ok()?.auth_external_user_id
    }
}

struct RuntimeSettingsCloudSyncUrlProvider {
    settings: Arc<dyn RuntimeSettingsRepository>,
    fallback: String,
}

#[async_trait::async_trait]
impl CloudSyncUrlProvider for RuntimeSettingsCloudSyncUrlProvider {
    async fn get(&self) -> String {
        self.settings
            .load()
            .await
            .ok()
            .and_then(|s| s.access_service_url)
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| self.fallback.clone())
    }
}

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
        access_service_url = %cfg.access_service_url,
        local_server_public_url = ?cfg.local_server_public_url,
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

    let state = AppState::new(pool, cfg.mqtt_topic_prefix.clone());

    let saved_settings = state.runtime_settings_repo.load().await?;
    let effective_mqtt_url = saved_settings
        .mqtt_gateway_url
        .or(cfg.mqtt_url.clone());
    if let Err(e) = state
        .mqtt_manager
        .reconfigure(effective_mqtt_url.as_deref())
        .await
    {
        tracing::warn!(error = %e, "MQTT unavailable, continuing without it");
    }

    let mqtt_client: Arc<dyn MqttClient> = state.mqtt_manager.clone();

    // Scenario engine
    let scenario_engine = Arc::new(
        ScenarioEngine::new(
            state.scenario_repo.clone(),
            state.scenario_exec_repo.clone(),
            Some(mqtt_client.clone()),
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

    // Spawn outbox pusher background task
    {
        let outbox = state.sync_outbox_repo.clone() as Arc<dyn local_server_application::services::SyncOutboxRepository>;
        let cloud = state.cloud_sync_client.clone();
        let notify = state.outbox_notify.clone();
        let url = cfg.cloud_sync_api_url.clone();
        let key = cfg.cloud_sync_api_key.clone();
        tokio::spawn(async move {
            run_outbox_pusher(outbox, cloud, notify, url, key).await;
        });
    }

    // Spawn delta puller background task
    {
        let access_sync = state.access_sync_repo.clone();
        let cloud = state.cloud_sync_client.clone();
        let url_provider = Arc::new(RuntimeSettingsCloudSyncUrlProvider {
            settings: state.runtime_settings_repo.clone(),
            fallback: cfg.cloud_sync_api_url.clone(),
        }) as Arc<dyn CloudSyncUrlProvider>;
        let key = cfg.cloud_sync_api_key.clone();
        let interval = cfg.sync_interval_secs;
        let user_id_provider = Arc::new(RuntimeSettingsUserIdProvider {
            settings: state.runtime_settings_repo.clone(),
        }) as Arc<dyn UserIdProvider>;
        tokio::spawn(async move {
            run_delta_puller(access_sync, cloud, interval, url_provider, key, user_id_provider).await;
        });
    }

    // Spawn scenario sync background task (pull from cloud, push local-only)
    {
        let repo = state.scenario_repo.clone();
        let cloud = state.cloud_scenario_client.clone();
        let url = cfg.scenario_service_url.clone();
        let interval = cfg.sync_interval_secs;
        tokio::spawn(async move {
            run_scenario_sync(repo, cloud, interval, url).await;
        });
    }

    // Spawn physical device sync background task
    {
        let repo = state.phys_repo.clone();
        let cloud = state.cloud_phys_dev_client.clone();
        let url = cfg.scenario_service_url.clone();
        let interval = cfg.sync_interval_secs;
        tokio::spawn(async move {
            run_physical_device_sync(repo, cloud, interval, url).await;
        });
    }

    // Spawn widget dashboard sync background task
    {
        let repo = state.widget_dashboard_repo.clone();
        let cloud = state.cloud_widget_dashboard_client.clone();
        let url = cfg.scenario_service_url.clone();
        let interval = cfg.sync_interval_secs;
        let access_sync = state.access_sync_repo.clone();
        let user_id_provider = Arc::new(RuntimeSettingsUserIdProvider {
            settings: state.runtime_settings_repo.clone(),
        }) as Arc<dyn UserIdProvider>;
        tokio::spawn(async move {
            run_widget_dashboard_sync(repo, cloud, interval, url, access_sync, user_id_provider).await;
        });
    }

    // Build HTTP router then wrap with Socket.IO layer
    let http_router = http::router(
        state.http_state(
            VERSION,
            cfg.access_service_url.clone(),
            cfg.local_server_public_url.clone(),
            cfg.scenario_service_url.clone(),
        ),
        state.device_repo.clone(),
        state.phys_repo.clone(),
        state.zigbee_repo.clone(),
        mqtt_client.clone(),
        cfg.mqtt_topic_prefix.clone(),
        state.scenario_repo.clone(),
        state.scenario_exec_repo.clone(),
        scenario_engine,
        state.access_repo.clone(),
        state.access_evaluator.clone(),
        state.widget_dashboard_repo.clone(),
        state.modbus_repo.clone(),
        state.modbus_bridge.clone(),
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
