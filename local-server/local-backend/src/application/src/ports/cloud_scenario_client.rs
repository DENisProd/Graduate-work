use async_trait::async_trait;
use serde_json::Value;

use local_server_core::DomainError;

#[derive(Debug, Clone)]
pub struct RemoteScenario {
    pub cloud_id: String,
    pub name: String,
    pub description: Option<String>,
    pub house_id: String,
    pub creator_id: String,
    pub definition: Value,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone)]
pub struct CreateCloudScenarioCmd {
    pub name: String,
    pub description: Option<String>,
    pub house_id: String,
    pub creator_id: String,
    pub definition: Value,
    pub status: String,
}

/// Outbound port — fetches and pushes scenarios to/from the cloud scenario-service.
#[async_trait]
pub trait CloudScenarioClient: Send + Sync {
    /// Fetch all scenarios from cloud (handles pagination internally).
    async fn list_all(&self, base_url: &str) -> Result<Vec<RemoteScenario>, DomainError>;

    /// Create a scenario in the cloud and return the cloud record with its ObjectId.
    async fn create(
        &self,
        base_url: &str,
        cmd: CreateCloudScenarioCmd,
    ) -> Result<RemoteScenario, DomainError>;
}
