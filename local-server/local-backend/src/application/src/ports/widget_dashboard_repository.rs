use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde_json::Value;
use uuid::Uuid;

use local_server_core::{DomainError, entities::widget_dashboard::WidgetDashboard};

pub struct CreateWidgetDashboardCmd {
    pub house_id: String,
    pub user_id: String,
    pub name: String,
    pub is_default: bool,
    pub layouts: Value,
    pub widgets: Vec<Value>,
}

pub struct UpdateWidgetDashboardCmd {
    pub name: Option<String>,
    pub is_default: Option<bool>,
    pub layouts: Option<Value>,
    pub widgets: Option<Vec<Value>>,
}

pub struct UpsertFromCloudWidgetDashboardCmd {
    pub house_id: String,
    pub user_id: String,
    pub name: String,
    pub is_default: bool,
    pub layouts: Value,
    pub widgets: Vec<Value>,
    pub cloud_updated_at: DateTime<Utc>,
}

#[async_trait]
pub trait WidgetDashboardRepository: Send + Sync {
    async fn find_by_house(&self, house_id: &str) -> Result<Vec<WidgetDashboard>, DomainError>;
    async fn find_primary_for_house(
        &self,
        house_id: &str,
    ) -> Result<Option<WidgetDashboard>, DomainError>;
    async fn find_by_id(&self, id: &Uuid) -> Result<Option<WidgetDashboard>, DomainError>;
    async fn create(
        &self,
        cmd: CreateWidgetDashboardCmd,
    ) -> Result<WidgetDashboard, DomainError>;
    async fn update(
        &self,
        id: &Uuid,
        cmd: UpdateWidgetDashboardCmd,
    ) -> Result<WidgetDashboard, DomainError>;
    async fn delete(&self, id: &Uuid) -> Result<(), DomainError>;
    async fn clear_default(&self, house_id: &str, user_id: &str) -> Result<(), DomainError>;

    async fn upsert_from_cloud(
        &self,
        cloud_id: &str,
        cmd: UpsertFromCloudWidgetDashboardCmd,
    ) -> Result<WidgetDashboard, DomainError>;
    async fn list_without_cloud_id(&self) -> Result<Vec<WidgetDashboard>, DomainError>;
    async fn list_with_cloud_id(&self) -> Result<Vec<WidgetDashboard>, DomainError>;
    async fn set_cloud_id(&self, id: &Uuid, cloud_id: &str) -> Result<(), DomainError>;
    async fn mark_pushed_at(&self, id: &Uuid, at: DateTime<Utc>) -> Result<(), DomainError>;
}