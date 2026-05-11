use async_trait::async_trait;
use local_server_core::{entities::zigbee::ZigbeeDeviceState, DomainError};

#[async_trait]
pub trait ZigbeeRepository: Send + Sync {
    async fn insert_state(&self, state: &ZigbeeDeviceState) -> Result<(), DomainError>;
    async fn last_state(&self, ieee: &str) -> Result<Option<ZigbeeDeviceState>, DomainError>;
    async fn list_states(&self, ieee: &str, limit: i64) -> Result<Vec<ZigbeeDeviceState>, DomainError>;
    /// List states optionally filtered by IEEE address. `ieee = None` returns all devices.
    async fn list_states_filtered(
        &self,
        ieee: Option<&str>,
        limit: i64,
    ) -> Result<Vec<ZigbeeDeviceState>, DomainError>;
    /// List device log entries as raw JSON values. Supports filtering by IEEE address and time range.
    async fn list_logs(
        &self,
        ieee: Option<&str>,
        from: Option<&str>,
        to: Option<&str>,
        limit: i64,
    ) -> Result<Vec<serde_json::Value>, DomainError>;
}
