use async_trait::async_trait;
use local_server_core::DomainError;

pub use super::mqtt_connect_config::{MqttConnectConfig, MqttRuntimeConfig};

#[async_trait]
pub trait MqttClient: Send + Sync {
    async fn publish(&self, topic: &str, payload: &[u8]) -> Result<(), DomainError>;
    async fn is_connected(&self) -> bool;
    async fn current_url(&self) -> Option<String>;
    async fn is_cloud_connected(&self) -> bool;
    async fn cloud_current_url(&self) -> Option<String>;
    async fn reconfigure(&self, config: MqttRuntimeConfig) -> Result<(), DomainError>;
}