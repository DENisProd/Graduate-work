use async_trait::async_trait;
use local_server_core::DomainError;

#[async_trait]
pub trait MqttClient: Send + Sync {
    async fn publish(&self, topic: &str, payload: &[u8]) -> Result<(), DomainError>;
}
