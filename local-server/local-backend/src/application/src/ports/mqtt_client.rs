use async_trait::async_trait;
use local_server_core::DomainError;

#[async_trait]
pub trait MqttClient: Send + Sync {
    async fn publish(&self, topic: &str, payload: &[u8]) -> Result<(), DomainError>;
    async fn is_connected(&self) -> bool;
    async fn current_url(&self) -> Option<String>;
    async fn reconfigure(&self, mqtt_url: Option<&str>) -> Result<(), DomainError>;
}
