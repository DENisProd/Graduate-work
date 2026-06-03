use async_trait::async_trait;
use chrono::{DateTime, Utc};
use local_server_core::entities::scenario::{
    ExecutionStatus, Scenario, ScenarioDefinitionJson, ScenarioExecution, ScenarioStatus,
};
use uuid::Uuid;

use crate::DomainError;

pub struct CreateScenarioCmd {
    pub name: String,
    pub description: Option<String>,
    pub house_id: String,
    pub creator_id: String,
    pub definition: ScenarioDefinitionJson,
    pub status: ScenarioStatus,
}

pub struct UpdateScenarioCmd {
    pub name: Option<String>,
    pub description: Option<String>,
    pub definition: Option<ScenarioDefinitionJson>,
    pub status: Option<ScenarioStatus>,
}

pub struct UpsertFromCloudCmd {
    pub name: String,
    pub description: Option<String>,
    pub house_id: String,
    pub creator_id: String,
    pub definition: ScenarioDefinitionJson,
    pub status: ScenarioStatus,
    pub cloud_updated_at: DateTime<Utc>,
}

#[async_trait]
pub trait ScenarioRepository: Send + Sync {
    async fn find_online(&self) -> Result<Vec<Scenario>, DomainError>;
    async fn find_by_id(&self, id: &Uuid) -> Result<Option<Scenario>, DomainError>;
    async fn list(
        &self,
        house_id: Option<&str>,
        page: i64,
        size: i64,
    ) -> Result<(Vec<Scenario>, i64), DomainError>;
    async fn create(&self, cmd: CreateScenarioCmd) -> Result<Scenario, DomainError>;
    async fn update(&self, id: &Uuid, cmd: UpdateScenarioCmd) -> Result<Scenario, DomainError>;
    async fn delete(&self, id: &Uuid) -> Result<(), DomainError>;

    async fn upsert_from_cloud(
        &self,
        cloud_id: &str,
        cmd: UpsertFromCloudCmd,
    ) -> Result<Scenario, DomainError>;

    async fn list_without_cloud_id(&self) -> Result<Vec<Scenario>, DomainError>;

    async fn set_cloud_id(&self, id: &Uuid, cloud_id: &str) -> Result<(), DomainError>;
}

#[async_trait]
pub trait ScenarioExecutionRepository: Send + Sync {
    async fn create_execution(&self, exec: &ScenarioExecution) -> Result<(), DomainError>;
    async fn complete_execution(
        &self,
        id: &Uuid,
        status: ExecutionStatus,
        error: Option<String>,
        ended_at: DateTime<Utc>,
    ) -> Result<(), DomainError>;
    async fn find_execution_by_id(
        &self,
        id: &Uuid,
    ) -> Result<Option<ScenarioExecution>, DomainError>;
    async fn list_executions(
        &self,
        scenario_id: &Uuid,
        limit: i64,
    ) -> Result<Vec<ScenarioExecution>, DomainError>;
    async fn list_all_executions(
        &self,
        page: i64,
        size: i64,
    ) -> Result<(Vec<ScenarioExecution>, i64), DomainError>;
}