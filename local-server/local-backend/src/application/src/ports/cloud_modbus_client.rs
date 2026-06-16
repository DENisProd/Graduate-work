use async_trait::async_trait;
use serde_json::Value;

use local_server_core::DomainError;

#[derive(Debug, Clone)]
pub struct RemoteModbusDevice {
    pub cloud_id: String,
    pub name: String,
    pub slave_id: i64,
    pub house_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct RemoteModbusRegister {
    pub cloud_id: String,
    pub device_id: String,
    pub register_type: String,
    pub address: i64,
}

#[derive(Debug, Clone)]
pub struct CreateCloudModbusDeviceCmd {
    pub name: String,
    pub slave_id: i64,
    pub description: Option<String>,
    pub enabled: bool,
    pub house_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct CreateCloudModbusRegisterCmd {
    pub name: String,
    pub register_type: String,
    pub address: i64,
    pub count: i64,
    pub unit: Option<String>,
    pub scale_factor: f64,
    pub offset: f64,
    pub writable: bool,
}

#[async_trait]
pub trait CloudModbusClient: Send + Sync {
    async fn list_devices(&self, base_url: &str) -> Result<Vec<RemoteModbusDevice>, DomainError>;

    async fn create_device(
        &self,
        base_url: &str,
        cmd: CreateCloudModbusDeviceCmd,
    ) -> Result<RemoteModbusDevice, DomainError>;

    async fn update_device_house(
        &self,
        base_url: &str,
        cloud_id: &str,
        house_id: &str,
    ) -> Result<(), DomainError>;

    async fn list_registers(
        &self,
        base_url: &str,
        device_id: &str,
    ) -> Result<Vec<RemoteModbusRegister>, DomainError>;

    async fn create_register(
        &self,
        base_url: &str,
        device_id: &str,
        cmd: CreateCloudModbusRegisterCmd,
    ) -> Result<RemoteModbusRegister, DomainError>;
}

/// Remap modbus UUID fields in widget JSON from local IDs to cloud Mongo IDs.
pub fn remap_widget_modbus_ids(value: &mut Value, devices: &[(String, String)], registers: &[(String, String)]) {
    match value {
        Value::Object(map) => {
            for (local_key, cloud_key) in [
                ("modbusDeviceId", "modbusDeviceId"),
                ("modbusRegisterId", "modbusRegisterId"),
                ("toggleModbusDeviceId", "toggleModbusDeviceId"),
                ("toggleModbusRegisterId", "toggleModbusRegisterId"),
            ] {
                if let Some(Value::String(local_id)) = map.get(local_key) {
                    let table = if local_key.contains("Register") {
                        registers
                    } else {
                        devices
                    };
                    if let Some((_, cloud_id)) = table.iter().find(|(l, _)| l == local_id) {
                        map.insert(cloud_key.to_string(), Value::String(cloud_id.clone()));
                    }
                }
            }
            if let Some(Value::Array(items)) = map.get_mut("items") {
                for item in items {
                    remap_widget_modbus_ids(item, devices, registers);
                }
            }
            for (_, v) in map.iter_mut() {
                remap_widget_modbus_ids(v, devices, registers);
            }
        }
        Value::Array(arr) => {
            for item in arr {
                remap_widget_modbus_ids(item, devices, registers);
            }
        }
        _ => {}
    }
}
