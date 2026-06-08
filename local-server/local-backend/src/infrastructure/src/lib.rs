
pub mod gpio;
pub mod http;
pub mod mqtt;
pub mod persistence;

pub use http::{
    ReqwestCloudAuthClient, ReqwestCloudPhysicalDeviceClient, ReqwestCloudScenarioClient,
    ReqwestCloudSyncClient, ReqwestCloudWidgetDashboardClient,
};
pub use mqtt::{run_ingestion, run_mqtt_bridge, ModbusGateway, RumqttcClient};
pub use persistence::{
    OutboxWriter, SqliteAccessRepo, SqliteAccessSyncRepo, SqliteDeviceRepo, SqliteModbusRepo,
    SqlitePhysicalDeviceRepo, SqliteRuntimeSettingsRepo, SqliteScenarioExecutionRepo,
    SqliteScenarioRepo, SqliteSyncOutboxRepo, SqliteWidgetDashboardRepo, SqliteZigbeeRepo,
};
pub use sqlx::SqlitePool;