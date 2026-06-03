use std::sync::Arc;

use local_server_application::ports::{
    AccessSyncRepository, CloudAuthClient, CloudScenarioClient, CloudSyncClient,
    CloudWidgetDashboardClient, HealthChecker, MqttClient, RuntimeSettingsRepository,
    ScenarioRepository, WidgetDashboardRepository,
};

#[derive(Clone)]
pub struct HttpAppState {
    pub version: &'static str,
    pub health: Arc<dyn HealthChecker>,
    pub runtime_settings: Arc<dyn RuntimeSettingsRepository>,
    pub mqtt: Arc<dyn MqttClient>,
    pub cloud_auth: Arc<dyn CloudAuthClient>,
    pub cloud_sync: Arc<dyn CloudSyncClient>,
    pub access_sync: Arc<dyn AccessSyncRepository>,
    pub default_access_service_url: String,
    pub default_cloud_sync_url: String,
    pub public_base_url: Option<String>,
    pub cloud_scenario: Arc<dyn CloudScenarioClient>,
    pub cloud_widget_dashboard: Arc<dyn CloudWidgetDashboardClient>,
    pub scenario_repo: Arc<dyn ScenarioRepository>,
    pub widget_dashboard_repo: Arc<dyn WidgetDashboardRepository>,
    pub scenario_service_url: String,
    pub serial_number: Option<String>,
}