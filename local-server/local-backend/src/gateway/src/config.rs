use serde::Deserialize;

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
    #[serde(default)]
    pub mqtt_url: Option<String>,
    #[serde(default = "default_mqtt_prefix")]
    pub mqtt_topic_prefix: String,
    #[serde(default = "default_access_service_url")]
    pub access_service_url: String,
    #[serde(default)]
    pub local_server_public_url: Option<String>,
    #[serde(default = "default_cloud_sync_url")]
    pub cloud_sync_api_url: String,
    #[serde(default)]
    pub cloud_sync_api_key: String,
    #[serde(default = "default_sync_interval_secs")]
    pub sync_interval_secs: u64,
    #[serde(default = "default_scenario_service_url")]
    pub scenario_service_url: String,
    #[serde(default)]
    pub serial_number: Option<String>,
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
        if let Ok(v) = std::env::var("ACCESS_SERVICE_URL") {
            builder = builder.set_override("access_service_url", v)?;
        }
        if let Ok(v) = std::env::var("LOCAL_SERVER_PUBLIC_URL") {
            builder = builder.set_override("local_server_public_url", v)?;
        }
        if let Ok(v) = std::env::var("CLOUD_SYNC_API_URL") {
            builder = builder.set_override("cloud_sync_api_url", v)?;
        }
        if let Ok(v) = std::env::var("CLOUD_SYNC_API_KEY") {
            builder = builder.set_override("cloud_sync_api_key", v)?;
        }
        if let Ok(v) = std::env::var("SYNC_INTERVAL_SECS") {
            builder = builder.set_override("sync_interval_secs", v)?;
        }
        if let Ok(v) = std::env::var("SCENARIO_SERVICE_URL") {
            builder = builder.set_override("scenario_service_url", v)?;
        }
        if let Ok(v) = std::env::var("LOCAL_SERVER_SERIAL") {
            builder = builder.set_override("serial_number", v)?;
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
fn default_access_service_url() -> String { "http://localhost:8082".into() }
fn default_cloud_sync_url() -> String { "http://localhost:8082".into() }
fn default_sync_interval_secs() -> u64 { 300 }
fn default_scenario_service_url() -> String { "http://localhost:8082/api/scenario".into() }