use async_trait::async_trait;
use local_server_core::DomainError;

#[derive(Debug, Clone)]
pub struct RemotePhysicalDevice {
    pub cloud_id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub house_id: Option<String>,
    pub room_id: Option<String>,
    pub device_id: Option<i64>,
    pub device_category_id: Option<i64>,
    pub protocol_address: Option<String>,
    pub manufacturer_name: Option<String>,
    pub model: Option<String>,
    pub friendly_name: Option<String>,
    pub firmware_version: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone)]
pub struct CreateCloudPhysicalDeviceCmd {
    pub name: Option<String>,
    pub house_id: Option<String>,
    pub room_id: Option<String>,
    pub device_id: Option<i64>,
    pub device_category_id: Option<i64>,
    pub protocol_address: Option<String>,
    pub manufacturer_name: Option<String>,
    pub model: Option<String>,
    pub friendly_name: Option<String>,
    pub firmware_version: Option<String>,
}

#[async_trait]
pub trait CloudPhysicalDeviceClient: Send + Sync {
    async fn list_all(&self, base_url: &str) -> Result<Vec<RemotePhysicalDevice>, DomainError>;

    async fn create(
        &self,
        base_url: &str,
        cmd: CreateCloudPhysicalDeviceCmd,
    ) -> Result<RemotePhysicalDevice, DomainError>;
}