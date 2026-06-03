use async_trait::async_trait;
use local_server_core::entities::modbus::{ModbusDevice, ModbusRegister, ModbusRegisterState, RegisterType};
use uuid::Uuid;

use crate::DomainError;

pub struct CreateModbusDeviceCmd {
    pub name: String,
    pub slave_id: i64,
    pub description: Option<String>,
    pub enabled: bool,
}

pub struct CreateModbusRegisterCmd {
    pub device_id: Uuid,
    pub name: String,
    pub register_type: RegisterType,
    pub address: i64,
    pub count: i64,
    pub unit: Option<String>,
    pub scale_factor: f64,
    pub offset: f64,
    pub writable: bool,
}

pub struct SaveModbusStateCmd {
    pub register_id: Uuid,
    pub raw_values: Vec<serde_json::Value>,
    pub scaled_values: Vec<f64>,
}

#[async_trait]
pub trait ModbusRepository: Send + Sync {
    async fn list_devices(&self) -> Result<Vec<ModbusDevice>, DomainError>;
    async fn find_device(&self, id: Uuid) -> Result<Option<ModbusDevice>, DomainError>;
    async fn create_device(&self, cmd: CreateModbusDeviceCmd) -> Result<ModbusDevice, DomainError>;
    async fn delete_device(&self, id: Uuid) -> Result<(), DomainError>;

    async fn list_registers(&self, device_id: Uuid) -> Result<Vec<ModbusRegister>, DomainError>;
    async fn find_register(&self, id: Uuid) -> Result<Option<ModbusRegister>, DomainError>;
    async fn create_register(&self, cmd: CreateModbusRegisterCmd) -> Result<ModbusRegister, DomainError>;
    async fn delete_register(&self, id: Uuid) -> Result<(), DomainError>;

    async fn save_state(&self, cmd: SaveModbusStateCmd) -> Result<(), DomainError>;
    async fn get_state(&self, register_id: Uuid) -> Result<Option<ModbusRegisterState>, DomainError>;
    async fn get_device_states(&self, device_id: Uuid) -> Result<Vec<ModbusRegisterState>, DomainError>;
}