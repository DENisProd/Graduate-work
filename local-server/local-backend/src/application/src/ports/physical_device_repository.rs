use async_trait::async_trait;
use chrono::{DateTime, Utc};
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

pub struct UpsertPhysDevFromCloudCmd {
    pub name: Option<String>,
    pub description: Option<String>,
    pub house_id: Option<String>,
    pub room_id: Option<String>,
    pub device_id: Option<i64>,
    pub device_category_id: Option<i64>,
    pub manufacturer_name: Option<String>,
    pub model: Option<String>,
    pub friendly_name: Option<String>,
    pub firmware_version: Option<String>,
    pub cloud_updated_at: DateTime<Utc>,
}

pub struct UpsertFromBridgeCmd {
    pub ieee_address: String,
    pub friendly_name: Option<String>,
    pub device_type: Option<String>,
    pub network_address: Option<i64>,
    pub manufacturer_name: Option<String>,
    pub model: Option<String>,
    pub firmware_version: Option<String>,
    pub power_source: Option<String>,
    pub interview_completed: bool,
    pub definition: Option<serde_json::Value>,
}

pub use self::UpsertFromBridgeCmd as UpsertPhysicalDeviceFromBridgeCmd;

#[async_trait]
pub trait PhysicalDeviceRepository: Send + Sync {
    async fn find_all(
        &self,
        filter: PhysicalDeviceFilter,
    ) -> Result<Vec<PhysicalDevice>, DomainError>;
    async fn find_by_id(&self, id: Uuid) -> Result<Option<PhysicalDevice>, DomainError>;
    async fn find_by_ieee(&self, ieee: &str) -> Result<Option<PhysicalDevice>, DomainError>;
    async fn list_zigbee_devices(&self) -> Result<Vec<PhysicalDevice>, DomainError>;
    async fn create(&self, cmd: CreatePhysicalDeviceCmd) -> Result<PhysicalDevice, DomainError>;
    async fn update(
        &self,
        id: Uuid,
        cmd: UpdatePhysicalDeviceCmd,
    ) -> Result<PhysicalDevice, DomainError>;
    async fn delete(&self, id: Uuid) -> Result<(), DomainError>;
    async fn delete_by_ieee(&self, ieee: &str) -> Result<(), DomainError>;
    async fn upsert_by_ieee(
        &self,
        cmd: UpsertFromBridgeCmd,
    ) -> Result<PhysicalDevice, DomainError>;
    async fn update_last_seen(&self, ieee: &str) -> Result<(), DomainError>;

    async fn upsert_from_cloud(
        &self,
        cloud_id: &str,
        protocol_address: Option<&str>,
        cmd: UpsertPhysDevFromCloudCmd,
    ) -> Result<PhysicalDevice, DomainError>;

    async fn list_without_cloud_id(&self) -> Result<Vec<PhysicalDevice>, DomainError>;

    async fn set_phys_cloud_id(&self, id: Uuid, cloud_id: &str) -> Result<(), DomainError>;
}