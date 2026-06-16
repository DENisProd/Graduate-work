use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use local_server_application::ports::{
    CloudModbusClient, CreateCloudModbusDeviceCmd, CreateCloudModbusRegisterCmd,
    RemoteModbusDevice, RemoteModbusRegister, RuntimeSettingsRepository,
};
use local_server_core::DomainError;

use super::cloud_auth_request::{apply_bearer, resolve_bearer_token, scenario_api_url};

#[derive(Clone)]
pub struct ReqwestCloudModbusClient {
    http: reqwest::Client,
    api_key: String,
    settings: Option<Arc<dyn RuntimeSettingsRepository>>,
}

impl ReqwestCloudModbusClient {
    pub fn with_settings(
        api_key: String,
        settings: Arc<dyn RuntimeSettingsRepository>,
    ) -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("reqwest client"),
            api_key,
            settings: Some(settings),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ModbusDeviceDto {
    id: String,
    name: String,
    slave_id: i64,
    house_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ModbusRegisterDto {
    id: String,
    device_id: String,
    register_type: String,
    address: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CreateModbusDeviceRequest {
    name: String,
    slave_id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    house_id: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateModbusDeviceRequest {
    house_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CreateModbusRegisterRequest {
    name: String,
    register_type: String,
    address: i64,
    count: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    unit: Option<String>,
    scale_factor: f64,
    offset: f64,
    writable: bool,
}

#[async_trait]
impl CloudModbusClient for ReqwestCloudModbusClient {
    async fn list_devices(&self, base_url: &str) -> Result<Vec<RemoteModbusDevice>, DomainError> {
        let url = scenario_api_url(base_url, "/modbus/devices");
        let token = resolve_bearer_token(self.settings.as_ref(), &self.api_key).await;
        let res = apply_bearer(self.http.get(&url), token)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("modbus list: {e}")))?;
        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "modbus list {status}: {body}"
            )));
        }
        res.json::<Vec<ModbusDeviceDto>>()
            .await
            .map(|v| {
                v.into_iter()
                    .map(|d| RemoteModbusDevice {
                        cloud_id: d.id,
                        name: d.name,
                        slave_id: d.slave_id,
                        house_id: d.house_id,
                    })
                    .collect()
            })
            .map_err(|e| DomainError::Internal(format!("parse modbus devices: {e}")))
    }

    async fn create_device(
        &self,
        base_url: &str,
        cmd: CreateCloudModbusDeviceCmd,
    ) -> Result<RemoteModbusDevice, DomainError> {
        let url = scenario_api_url(base_url, "/modbus/devices");
        let body = CreateModbusDeviceRequest {
            name: cmd.name,
            slave_id: cmd.slave_id,
            description: cmd.description,
            enabled: cmd.enabled,
            house_id: cmd.house_id,
        };
        let token = resolve_bearer_token(self.settings.as_ref(), &self.api_key).await;
        let res = apply_bearer(self.http.post(&url).json(&body), token)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("modbus create: {e}")))?;
        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "modbus create {status}: {body}"
            )));
        }
        res.json::<ModbusDeviceDto>()
            .await
            .map(|d| RemoteModbusDevice {
                cloud_id: d.id,
                name: d.name,
                slave_id: d.slave_id,
                house_id: d.house_id,
            })
            .map_err(|e| DomainError::Internal(format!("parse created modbus: {e}")))
    }

    async fn update_device_house(
        &self,
        base_url: &str,
        cloud_id: &str,
        house_id: &str,
    ) -> Result<(), DomainError> {
        let url = scenario_api_url(base_url, &format!("/modbus/devices/{cloud_id}"));
        let body = UpdateModbusDeviceRequest {
            house_id: house_id.to_string(),
        };
        let token = resolve_bearer_token(self.settings.as_ref(), &self.api_key).await;
        let res = apply_bearer(self.http.patch(&url).json(&body), token)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("modbus patch: {e}")))?;
        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "modbus patch {status}: {body}"
            )));
        }
        Ok(())
    }

    async fn list_registers(
        &self,
        base_url: &str,
        device_id: &str,
    ) -> Result<Vec<RemoteModbusRegister>, DomainError> {
        let url = scenario_api_url(base_url, &format!("/modbus/devices/{device_id}/registers"));
        let token = resolve_bearer_token(self.settings.as_ref(), &self.api_key).await;
        let res = apply_bearer(self.http.get(&url), token)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("modbus regs list: {e}")))?;
        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "modbus regs list {status}: {body}"
            )));
        }
        res.json::<Vec<ModbusRegisterDto>>()
            .await
            .map(|v| {
                v.into_iter()
                    .map(|r| RemoteModbusRegister {
                        cloud_id: r.id,
                        device_id: r.device_id,
                        register_type: r.register_type,
                        address: r.address,
                    })
                    .collect()
            })
            .map_err(|e| DomainError::Internal(format!("parse modbus regs: {e}")))
    }

    async fn create_register(
        &self,
        base_url: &str,
        device_id: &str,
        cmd: CreateCloudModbusRegisterCmd,
    ) -> Result<RemoteModbusRegister, DomainError> {
        let url = scenario_api_url(base_url, &format!("/modbus/devices/{device_id}/registers"));
        let body = CreateModbusRegisterRequest {
            name: cmd.name,
            register_type: cmd.register_type,
            address: cmd.address,
            count: cmd.count,
            unit: cmd.unit,
            scale_factor: cmd.scale_factor,
            offset: cmd.offset,
            writable: cmd.writable,
        };
        let token = resolve_bearer_token(self.settings.as_ref(), &self.api_key).await;
        let res = apply_bearer(self.http.post(&url).json(&body), token)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("modbus reg create: {e}")))?;
        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "modbus reg create {status}: {body}"
            )));
        }
        res.json::<ModbusRegisterDto>()
            .await
            .map(|r| RemoteModbusRegister {
                cloud_id: r.id,
                device_id: r.device_id,
                register_type: r.register_type,
                address: r.address,
            })
            .map_err(|e| DomainError::Internal(format!("parse created modbus reg: {e}")))
    }
}
