use async_trait::async_trait;
use local_server_core::entities::device::{
    Device, DeviceCategory, DeviceDetailed, DeviceFunction, DeviceStatus, DeviceType,
};

use crate::DomainError;

pub struct PageResult<T> {
    pub content: Vec<T>,
    pub total_elements: i64,
    pub page: i64,
    pub size: i64,
}

pub struct CreateDeviceCmd {
    pub code: String,
    pub device_category_id: i64,
    pub status: DeviceStatus,
    pub serial_number: Option<String>,
    pub firmware_version: Option<String>,
    pub active: bool,
    pub is_moderated: bool,
}

pub struct UpdateDeviceCmd {
    pub code: String,
    pub device_category_id: i64,
    pub status: DeviceStatus,
    pub serial_number: Option<String>,
    pub firmware_version: Option<String>,
    pub active: bool,
}

#[async_trait]
pub trait DeviceRepository: Send + Sync {
    async fn find_all(&self, page: i64, size: i64) -> Result<PageResult<Device>, DomainError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Device>, DomainError>;
    async fn find_detailed(&self, id: i64) -> Result<Option<DeviceDetailed>, DomainError>;
    async fn find_by_code(&self, code: &str) -> Result<Option<Device>, DomainError>;
    async fn create(&self, cmd: CreateDeviceCmd) -> Result<Device, DomainError>;
    async fn update(&self, id: i64, cmd: UpdateDeviceCmd) -> Result<Device, DomainError>;
    async fn soft_delete(&self, id: i64) -> Result<(), DomainError>;
    async fn update_status(&self, id: i64, status: DeviceStatus) -> Result<Device, DomainError>;
    async fn find_functions_by_device(
        &self,
        device_id: i64,
    ) -> Result<Vec<DeviceFunction>, DomainError>;
    async fn update_function_value(
        &self,
        fn_id: i64,
        value: &str,
    ) -> Result<DeviceFunction, DomainError>;
    async fn find_all_categories(&self) -> Result<Vec<DeviceCategory>, DomainError>;
    async fn find_all_types(&self) -> Result<Vec<DeviceType>, DomainError>;
}
