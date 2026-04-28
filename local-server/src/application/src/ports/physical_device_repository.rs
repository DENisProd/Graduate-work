use async_trait::async_trait;
use local_server_core::entities::physical_device::PhysicalDevice;
use uuid::Uuid;

use crate::DomainError;

pub struct PhysicalDeviceFilter {
    pub house_id: Option<String>,
    pub room_id: Option<String>,
}

pub struct CreatePhysicalDeviceCmd {
    pub name: Option<String>,
    pub description: Option<String>,
    pub house_id: Option<String>,
    pub room_id: Option<String>,
    pub device_id: Option<i64>,
    pub device_category_id: Option<i64>,
    pub protocol_address: Option<String>,
    pub r#type: Option<String>,
    pub manufacturer_name: Option<String>,
    pub model: Option<String>,
    pub friendly_name: Option<String>,
    pub firmware_version: Option<String>,
}

pub struct UpdatePhysicalDeviceCmd {
    pub name: Option<String>,
    pub description: Option<String>,
    pub room_id: Option<String>,
    pub device_id: Option<i64>,
    pub device_category_id: Option<i64>,
    pub friendly_name: Option<String>,
}

#[async_trait]
pub trait PhysicalDeviceRepository: Send + Sync {
    async fn find_all(
        &self,
        filter: PhysicalDeviceFilter,
    ) -> Result<Vec<PhysicalDevice>, DomainError>;
    async fn find_by_id(&self, id: Uuid) -> Result<Option<PhysicalDevice>, DomainError>;
    async fn create(&self, cmd: CreatePhysicalDeviceCmd) -> Result<PhysicalDevice, DomainError>;
    async fn update(
        &self,
        id: Uuid,
        cmd: UpdatePhysicalDeviceCmd,
    ) -> Result<PhysicalDevice, DomainError>;
    async fn delete(&self, id: Uuid) -> Result<(), DomainError>;
}
