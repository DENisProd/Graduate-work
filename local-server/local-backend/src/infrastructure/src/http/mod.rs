//! Outbound HTTP adapters (reqwest): cloud auth, sync and scenario clients.

mod cloud_auth;
mod cloud_physical_device;
mod cloud_scenario;
mod cloud_sync;
mod cloud_widget_dashboard;

pub use cloud_auth::ReqwestCloudAuthClient;
pub use cloud_physical_device::ReqwestCloudPhysicalDeviceClient;
pub use cloud_scenario::ReqwestCloudScenarioClient;
pub use cloud_sync::ReqwestCloudSyncClient;
pub use cloud_widget_dashboard::ReqwestCloudWidgetDashboardClient;
