use serde::Deserialize;

/// Runtime configuration loaded from layered TOML files plus environment
/// overrides.
///
/// Layers (later overrides earlier):
///   1. `config/default.toml` — committed defaults
///   2. `config/local.toml`   — gitignored, per-machine overrides
///   3. Environment variables  — final override
#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_database_url")]
    pub database_url: String,
    #[serde(default = "default_max_connections")]
    pub max_db_connections: u32,
    #[serde(default = "default_busy_timeout_ms")]
    pub busy_timeout_ms: u32,
    #[serde(default = "default_shutdown_secs")]
    pub graceful_shutdown_secs: u64,
    /// MQTT broker URL, e.g. `mqtt://localhost:1883`.  Optional — if absent,
    /// MQTT ingestion and WebSocket live state are disabled.
    #[serde(default)]
    pub mqtt_url: Option<String>,
    /// Topic prefix used by Zigbee2MQTT (default: `zigbee2mqtt`).
    #[serde(default = "default_mqtt_prefix")]
    pub mqtt_topic_prefix: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        let mut builder = config::Config::builder()
            .add_source(config::File::with_name("config/default").required(false))
            .add_source(config::File::with_name("config/local").required(false));

        if let Ok(v) = std::env::var("LOCAL_SERVER_PORT") {
            builder = builder.set_override("port", v)?;
        }
        if let Ok(v) = std::env::var("DATABASE_URL") {
            builder = builder.set_override("database_url", v)?;
        }
        if let Ok(v) = std::env::var("ZIGBEE_MQTT_URL") {
            builder = builder.set_override("mqtt_url", v)?;
        }
        if let Ok(v) = std::env::var("MQTT_TOPIC_PREFIX") {
            builder = builder.set_override("mqtt_topic_prefix", v)?;
        }

        Ok(builder.build()?.try_deserialize::<Self>()?)
    }
}

fn default_port() -> u16 { 8080 }
fn default_database_url() -> String { "sqlite:./data/local.db".into() }
fn default_max_connections() -> u32 { 5 }
fn default_busy_timeout_ms() -> u32 { 5_000 }
fn default_shutdown_secs() -> u64 { 10 }
fn default_mqtt_prefix() -> String { "zigbee2mqtt".into() }
