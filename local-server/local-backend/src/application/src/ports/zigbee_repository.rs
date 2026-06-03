use async_trait::async_trait;
use local_server_core::{entities::zigbee::ZigbeeDeviceState, DomainError};

#[async_trait]
pub trait ZigbeeRepository: Send + Sync {
    async fn insert_state(&self, state: &ZigbeeDeviceState) -> Result<(), DomainError>;
    async fn last_state(&self, ieee: &str) -> Result<Option<ZigbeeDeviceState>, DomainError>;
    async fn list_states(&self, ieee: &str, limit: i64) -> Result<Vec<ZigbeeDeviceState>, DomainError>;
    async fn list_states_filtered(
        &self,
        ieee: Option<&str>,
        limit: i64,
    ) -> Result<Vec<ZigbeeDeviceState>, DomainError>;
    async fn list_logs(
        &self,
        ieee: Option<&str>,
        from: Option<&str>,
        to: Option<&str>,
        limit: i64,
    ) -> Result<Vec<serde_json::Value>, DomainError>;
}