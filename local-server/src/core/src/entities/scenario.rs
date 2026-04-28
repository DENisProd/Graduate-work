use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum ScenarioStatus {
    Online,
    Offline,
    Error,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TriggerSource {
    Schedule,
    Manual,
    Automatic,
    Api,
}

/// JSON-serialized scenario DSL (parsed lazily by the engine in LS-004).
pub type ScenarioDefinitionJson = serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scenario {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub house_id: String,
    pub creator_id: String,
    pub definition: ScenarioDefinitionJson,
    pub status: ScenarioStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
