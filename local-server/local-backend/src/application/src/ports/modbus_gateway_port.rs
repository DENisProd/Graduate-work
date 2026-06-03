use std::sync::Arc;

use async_trait::async_trait;

use super::MqttClient;
use crate::DomainError;

#[async_trait]
pub trait ModbusBridgePort: Send + Sync {
    async fn execute(
        &self,
        mqtt: Arc<dyn MqttClient>,
        cmd: serde_json::Value,
    ) -> Result<serde_json::Value, DomainError>;
}