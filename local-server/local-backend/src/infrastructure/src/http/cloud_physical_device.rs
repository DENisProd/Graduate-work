use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use local_server_application::ports::{
    CloudPhysicalDeviceClient, CreateCloudPhysicalDeviceCmd, RemotePhysicalDevice,
    RuntimeSettingsRepository,
};
use local_server_core::DomainError;

use super::cloud_auth_request::{apply_bearer, resolve_bearer_token, scenario_api_url};

#[derive(Clone)]
pub struct ReqwestCloudPhysicalDeviceClient {
    http: reqwest::Client,
    api_key: String,
    settings: Option<Arc<dyn RuntimeSettingsRepository>>,
}

impl ReqwestCloudPhysicalDeviceClient {
    pub fn new() -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("reqwest client"),
            api_key: String::new(),
            settings: None,
        }
    }

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

impl Default for ReqwestCloudPhysicalDeviceClient {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PhysicalDeviceDto {
    id: String,
    name: Option<String>,
    description: Option<String>,
    house_id: Option<String>,
    room_id: Option<String>,
    device_id: Option<i64>,
    device_category_id: Option<i64>,
    mac_address: Option<String>,
    manufacturer_name: Option<String>,
    model: Option<String>,
    friendly_name: Option<String>,
    firmware_version: Option<String>,
    updated_at: String,
    #[allow(dead_code)]
    created_at: Option<String>,
}

impl From<PhysicalDeviceDto> for RemotePhysicalDevice {
    fn from(d: PhysicalDeviceDto) -> Self {
        RemotePhysicalDevice {
            cloud_id: d.id,
            protocol_address: d.mac_address,
            name: d.name,
            description: d.description,
            house_id: d.house_id,
            room_id: d.room_id,
            device_id: d.device_id,
            device_category_id: d.device_category_id,
            manufacturer_name: d.manufacturer_name,
            model: d.model,
            friendly_name: d.friendly_name,
            firmware_version: d.firmware_version,
            updated_at: d.updated_at,
        }
    }
}

#[derive(Deserialize)]
struct PageDto {
    items: Vec<PhysicalDeviceDto>,
    #[allow(dead_code)]
    total: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CreatePhysicalDeviceRequest {
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    house_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    room_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    device_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    device_category_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    mac_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    manufacturer_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    friendly_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    firmware_version: Option<String>,
}

#[async_trait]
impl CloudPhysicalDeviceClient for ReqwestCloudPhysicalDeviceClient {
    async fn list_all(&self, base_url: &str) -> Result<Vec<RemotePhysicalDevice>, DomainError> {
        let mut all: Vec<RemotePhysicalDevice> = Vec::new();
        let mut page: usize = 1;
        let token = resolve_bearer_token(self.settings.as_ref(), &self.api_key).await;

        loop {
            let url = scenario_api_url(
                base_url,
                &format!("/physical-devices?page={}&limit=100", page),
            );
            let res = apply_bearer(self.http.get(&url), token.clone())
                .send()
                .await
                .map_err(|e| DomainError::DependencyUnavailable(format!("phys-dev list: {e}")))?;

            if !res.status().is_success() {
                let status = res.status();
                let body = res.text().await.unwrap_or_default();
                return Err(DomainError::DependencyUnavailable(format!(
                    "scenario-service phys-dev list {status}: {body}"
                )));
            }

            let page_data = res
                .json::<PageDto>()
                .await
                .map_err(|e| DomainError::Internal(format!("parse phys-devs: {e}")))?;

            let fetched = page_data.items.len();
            all.extend(page_data.items.into_iter().map(RemotePhysicalDevice::from));

            if fetched < 100 {
                break;
            }
            page += 1;
        }

        Ok(all)
    }

    async fn create(
        &self,
        base_url: &str,
        cmd: CreateCloudPhysicalDeviceCmd,
    ) -> Result<RemotePhysicalDevice, DomainError> {
        let url = scenario_api_url(base_url, "/physical-devices");
        let name = cmd.name.unwrap_or_default();
        let house_id = cmd.house_id.unwrap_or_default();
        let body = CreatePhysicalDeviceRequest {
            name,
            description: None,
            house_id,
            room_id: cmd.room_id,
            device_id: cmd.device_id,
            device_category_id: cmd.device_category_id,
            mac_address: cmd.protocol_address,
            manufacturer_name: cmd.manufacturer_name,
            model: cmd.model,
            friendly_name: cmd.friendly_name,
            firmware_version: cmd.firmware_version,
        };

        let token = resolve_bearer_token(self.settings.as_ref(), &self.api_key).await;
        let res = apply_bearer(self.http.post(&url).json(&body), token)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("phys-dev create: {e}")))?;

        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "scenario-service phys-dev create {status}: {body}"
            )));
        }

        res.json::<PhysicalDeviceDto>()
            .await
            .map(RemotePhysicalDevice::from)
            .map_err(|e| DomainError::Internal(format!("parse created phys-dev: {e}")))
    }
}
