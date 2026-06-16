use async_trait::async_trait;
use serde_json::Value;

use local_server_core::DomainError;

#[derive(Debug, Clone)]
pub struct RemoteWidgetDashboard {
    pub cloud_id: String,
    pub house_id: String,
    pub user_id: String,
    pub name: String,
    pub is_default: bool,
    pub layouts: Value,
    pub widgets: Vec<Value>,
    pub updated_at: String,
    pub created_at: String,
}

#[derive(Debug, Clone)]
pub struct CreateCloudWidgetDashboardCmd {
    pub house_id: String,
    pub user_id: String,
    pub name: String,
    pub is_default: bool,
    pub layouts: Value,
    pub widgets: Vec<Value>,
}

pub struct UpdateCloudWidgetDashboardCmd {
    pub name: Option<String>,
    pub is_default: Option<bool>,
    pub layouts: Option<Value>,
    pub widgets: Option<Vec<Value>>,
}

#[async_trait]
pub trait CloudWidgetDashboardClient: Send + Sync {
    async fn list_by_house(
        &self,
        base_url: &str,
        house_id: &str,
    ) -> Result<Vec<RemoteWidgetDashboard>, DomainError>;

    async fn create(
        &self,
        base_url: &str,
        cmd: CreateCloudWidgetDashboardCmd,
    ) -> Result<RemoteWidgetDashboard, DomainError>;

    async fn update(
        &self,
        base_url: &str,
        cloud_id: &str,
        cmd: UpdateCloudWidgetDashboardCmd,
    ) -> Result<RemoteWidgetDashboard, DomainError>;
}