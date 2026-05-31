use std::sync::Arc;

use async_trait::async_trait;

use super::MqttClient;
use crate::DomainError;

/// Port for issuing Modbus commands through the MQTT bridge.
///
/// Implemented by `infrastructure::mqtt::ModbusGateway`.
/// Interfaces depend on this trait, not on the concrete gateway struct.
#[async_trait]
pub trait ModbusBridgePort: Send + Sync {
    async fn execute(
        &self,
        mqtt: Arc<dyn MqttClient>,
        cmd: serde_json::Value,
    ) -> Result<serde_json::Value, DomainError>;
}
