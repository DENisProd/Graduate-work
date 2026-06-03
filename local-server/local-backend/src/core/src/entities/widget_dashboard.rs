use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WidgetDashboard {
    pub id: Uuid,
    pub house_id: String,
    pub user_id: String,
    pub name: String,
    pub is_default: bool,
    pub layouts: serde_json::Value,
    pub widgets: Vec<serde_json::Value>,
    pub cloud_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}