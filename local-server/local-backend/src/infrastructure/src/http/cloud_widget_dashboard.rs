use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use local_server_application::ports::{
    CloudWidgetDashboardClient, CreateCloudWidgetDashboardCmd, RemoteWidgetDashboard,
};
use local_server_core::DomainError;

#[derive(Clone)]
pub struct ReqwestCloudWidgetDashboardClient {
    http: reqwest::Client,
}

impl ReqwestCloudWidgetDashboardClient {
    pub fn new() -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("reqwest client"),
        }
    }

    fn url(base: &str, path: &str) -> String {
        format!("{}/v1{}", base.trim_end_matches('/'), path)
    }
}

impl Default for ReqwestCloudWidgetDashboardClient {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WidgetDashboardDto {
    id: String,
    house_id: String,
    user_id: String,
    name: String,
    is_default: bool,
    #[serde(default)]
    layouts: Value,
    #[serde(default)]
    widgets: Vec<Value>,
    updated_at: String,
    created_at: String,
}

impl From<WidgetDashboardDto> for RemoteWidgetDashboard {
    fn from(d: WidgetDashboardDto) -> Self {
        RemoteWidgetDashboard {
            cloud_id: d.id,
            house_id: d.house_id,
            user_id: d.user_id,
            name: d.name,
            is_default: d.is_default,
            layouts: d.layouts,
            widgets: d.widgets,
            updated_at: d.updated_at,
            created_at: d.created_at,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CreateWidgetDashboardRequest {
    house_id: String,
    user_id: String,
    name: String,
    is_default: bool,
    layouts: Value,
    widgets: Vec<Value>,
}

#[async_trait]
impl CloudWidgetDashboardClient for ReqwestCloudWidgetDashboardClient {
    async fn list_by_house(
        &self,
        base_url: &str,
        house_id: &str,
    ) -> Result<Vec<RemoteWidgetDashboard>, DomainError> {
        let url = Self::url(
            base_url,
            &format!("/widget-dashboards?houseId={}", house_id),
        );
        let res = self
            .http
            .get(&url)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("widget-dash list: {e}")))?;

        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "scenario-service widget-dash list {status}: {body}"
            )));
        }

        res.json::<Vec<WidgetDashboardDto>>()
            .await
            .map(|v| v.into_iter().map(RemoteWidgetDashboard::from).collect())
            .map_err(|e| DomainError::Internal(format!("parse widget-dashes: {e}")))
    }

    async fn create(
        &self,
        base_url: &str,
        cmd: CreateCloudWidgetDashboardCmd,
    ) -> Result<RemoteWidgetDashboard, DomainError> {
        let url = Self::url(base_url, "/widget-dashboards");
        let body = CreateWidgetDashboardRequest {
            house_id: cmd.house_id,
            user_id: cmd.user_id,
            name: cmd.name,
            is_default: cmd.is_default,
            layouts: cmd.layouts,
            widgets: cmd.widgets,
        };

        let res = self
            .http
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("widget-dash create: {e}")))?;

        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "scenario-service widget-dash create {status}: {body}"
            )));
        }

        res.json::<WidgetDashboardDto>()
            .await
            .map(RemoteWidgetDashboard::from)
            .map_err(|e| DomainError::Internal(format!("parse created widget-dash: {e}")))
    }
}