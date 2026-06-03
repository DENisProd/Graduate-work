use std::sync::Arc;

use local_server_core::entities::scan_log::{new_scan_log, ScanLog};
use local_server_application::{
    ports::{
        AccessRepository, AccessSyncRepository, CloudAuthClient, CloudPhysicalDeviceClient,
        CloudScenarioClient, CloudSyncClient, CloudWidgetDashboardClient, DeviceRepository,
        HealthChecker, ModbusBridgePort, ModbusRepository, PhysicalDeviceRepository,
        RuntimeSettingsRepository, ScenarioExecutionRepository, ScenarioRepository,
        WidgetDashboardRepository, ZigbeeRepository,
    },
    services::{AccessEvaluator, ZigbeeRealtimeService},
};
use local_server_infrastructure::persistence::{
    OutboxWriter, SqliteAccessRepo, SqliteAccessSyncRepo, SqliteDeviceRepo, SqliteHealthChecker,
    SqliteModbusRepo, SqlitePhysicalDeviceRepo, SqliteRuntimeSettingsRepo,
    SqliteScenarioExecutionRepo, SqliteScenarioRepo, SqliteSyncOutboxRepo,
    SqliteWidgetDashboardRepo, SqliteZigbeeRepo,
};
use local_server_infrastructure::{
    ModbusGateway, ReqwestCloudAuthClient, ReqwestCloudPhysicalDeviceClient, ReqwestCloudScenarioClient,
    ReqwestCloudSyncClient, ReqwestCloudWidgetDashboardClient, SqlitePool,
};
use local_server_interfaces::HttpAppState;
use tokio::sync::Notify;

use crate::mqtt_manager::RuntimeMqttManager;

pub struct AppState {
    #[allow(dead_code)]
    pub pool: SqlitePool,
    pub health: Arc<dyn HealthChecker>,
    pub device_repo: Arc<dyn DeviceRepository>,
    pub phys_repo: Arc<dyn PhysicalDeviceRepository>,
    pub zigbee_repo: Arc<dyn ZigbeeRepository>,
    pub realtime_svc: Arc<ZigbeeRealtimeService>,
    pub scenario_repo: Arc<dyn ScenarioRepository>,
    pub scenario_exec_repo: Arc<dyn ScenarioExecutionRepository>,
    pub runtime_settings_repo: Arc<dyn RuntimeSettingsRepository>,
    pub cloud_auth_client: Arc<dyn CloudAuthClient>,
    pub cloud_sync_client: Arc<dyn CloudSyncClient>,
    pub cloud_scenario_client: Arc<dyn CloudScenarioClient>,
    pub cloud_phys_dev_client: Arc<dyn CloudPhysicalDeviceClient>,
    pub cloud_widget_dashboard_client: Arc<dyn CloudWidgetDashboardClient>,
    pub widget_dashboard_repo: Arc<dyn WidgetDashboardRepository>,
    pub access_sync_repo: Arc<dyn AccessSyncRepository>,
    pub access_repo: Arc<dyn AccessRepository>,
    pub access_evaluator: Arc<AccessEvaluator>,
    pub sync_outbox_repo: Arc<SqliteSyncOutboxRepo>,
    pub outbox_notify: Arc<Notify>,
    pub mqtt_manager: Arc<RuntimeMqttManager>,
    pub modbus_repo: Arc<dyn ModbusRepository>,
    pub modbus_bridge: Arc<dyn ModbusBridgePort>,
    pub scan_log: ScanLog,
}

impl AppState {
    pub fn new(pool: SqlitePool, mqtt_prefix: String, cloud_sync_api_key: String) -> Self {
        let outbox = Arc::new(OutboxWriter::new());

        let health = Arc::new(SqliteHealthChecker::new(pool.clone())) as Arc<dyn HealthChecker>;

        let device_repo = Arc::new(SqliteDeviceRepo::new(pool.clone(), outbox.clone()))
            as Arc<dyn DeviceRepository>;

        let phys_repo = Arc::new(SqlitePhysicalDeviceRepo::new(pool.clone(), outbox))
            as Arc<dyn PhysicalDeviceRepository>;

        let zigbee_repo =
            Arc::new(SqliteZigbeeRepo::new(pool.clone())) as Arc<dyn ZigbeeRepository>;

        let realtime_svc = Arc::new(ZigbeeRealtimeService::new());

        let scenario_repo =
            Arc::new(SqliteScenarioRepo::new(pool.clone())) as Arc<dyn ScenarioRepository>;

        let scenario_exec_repo = Arc::new(SqliteScenarioExecutionRepo::new(pool.clone()))
            as Arc<dyn ScenarioExecutionRepository>;

        let runtime_settings_repo = Arc::new(SqliteRuntimeSettingsRepo::new(pool.clone()))
            as Arc<dyn RuntimeSettingsRepository>;

        let cloud_auth_client =
            Arc::new(ReqwestCloudAuthClient::new()) as Arc<dyn CloudAuthClient>;

        let cloud_sync_client = Arc::new(ReqwestCloudSyncClient::with_settings(
            cloud_sync_api_key.clone(),
            runtime_settings_repo.clone(),
        )) as Arc<dyn CloudSyncClient>;

        let cloud_scenario_client = Arc::new(ReqwestCloudScenarioClient::with_settings(
            cloud_sync_api_key,
            runtime_settings_repo.clone(),
        )) as Arc<dyn CloudScenarioClient>;

        let cloud_phys_dev_client =
            Arc::new(ReqwestCloudPhysicalDeviceClient::new()) as Arc<dyn CloudPhysicalDeviceClient>;

        let cloud_widget_dashboard_client =
            Arc::new(ReqwestCloudWidgetDashboardClient::new()) as Arc<dyn CloudWidgetDashboardClient>;

        let widget_dashboard_repo =
            Arc::new(SqliteWidgetDashboardRepo::new(pool.clone())) as Arc<dyn WidgetDashboardRepository>;

        let access_sync_repo = Arc::new(SqliteAccessSyncRepo::new(pool.clone()))
            as Arc<dyn AccessSyncRepository>;

        let access_repo_inner = Arc::new(SqliteAccessRepo::new(pool.clone()));
        let access_repo = access_repo_inner.clone() as Arc<dyn AccessRepository>;
        let access_evaluator = Arc::new(AccessEvaluator::new(access_repo.clone()));

        let sync_outbox_repo = Arc::new(SqliteSyncOutboxRepo::new(pool.clone()));
        let outbox_notify = Arc::new(Notify::new());

        let modbus_repo =
            Arc::new(SqliteModbusRepo::new(pool.clone())) as Arc<dyn ModbusRepository>;
        let modbus_gateway = Arc::new(ModbusGateway::new());
        let modbus_bridge = modbus_gateway.clone() as Arc<dyn ModbusBridgePort>;

        let scan_log = new_scan_log();

        let mqtt_manager = Arc::new(RuntimeMqttManager::new(
            mqtt_prefix,
            zigbee_repo.clone(),
            phys_repo.clone(),
            realtime_svc.clone(),
            modbus_gateway.clone(),
            modbus_repo.clone(),
            scan_log.clone(),
        ));

        Self {
            pool,
            health,
            device_repo,
            phys_repo,
            zigbee_repo,
            realtime_svc,
            scenario_repo,
            scenario_exec_repo,
            runtime_settings_repo,
            cloud_auth_client,
            cloud_sync_client,
            cloud_scenario_client,
            cloud_phys_dev_client,
            cloud_widget_dashboard_client,
            widget_dashboard_repo,
            access_sync_repo,
            access_repo,
            access_evaluator,
            sync_outbox_repo,
            outbox_notify,
            mqtt_manager,
            modbus_repo,
            modbus_bridge,
            scan_log,
        }
    }

    pub fn http_state(
        &self,
        version: &'static str,
        default_access_service_url: String,
        default_cloud_sync_url: String,
        public_base_url: Option<String>,
        scenario_service_url: String,
        serial_number: Option<String>,
    ) -> HttpAppState {
        HttpAppState {
            version,
            health: self.health.clone(),
            runtime_settings: self.runtime_settings_repo.clone(),
            mqtt: self.mqtt_manager.clone(),
            cloud_auth: self.cloud_auth_client.clone(),
            cloud_sync: self.cloud_sync_client.clone(),
            access_sync: self.access_sync_repo.clone(),
            default_access_service_url,
            default_cloud_sync_url,
            public_base_url,
            cloud_scenario: self.cloud_scenario_client.clone(),
            cloud_widget_dashboard: self.cloud_widget_dashboard_client.clone(),
            scenario_repo: self.scenario_repo.clone(),
            widget_dashboard_repo: self.widget_dashboard_repo.clone(),
            scenario_service_url,
            serial_number,
        }
    }
}