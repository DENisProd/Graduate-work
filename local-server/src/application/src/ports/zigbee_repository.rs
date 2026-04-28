use async_trait::async_trait;
use local_server_core::{entities::zigbee::ZigbeeDeviceState, DomainError};

#[async_trait]
pub trait ZigbeeRepository: Send + Sync {
    async fn insert_state(&self, state: &ZigbeeDeviceState) -> Result<(), DomainError>;
    async fn last_state(&self, ieee: &str) -> Result<Option<ZigbeeDeviceState>, DomainError>;
    async fn list_states(&self, ieee: &str, limit: i64) -> Result<Vec<ZigbeeDeviceState>, DomainError>;
}
