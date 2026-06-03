use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use local_server_application::ports::{
    CloudScenarioClient, CreateCloudScenarioCmd, RemoteScenario, RuntimeSettingsRepository,
};
use local_server_core::DomainError;

#[derive(Clone)]
pub struct ReqwestCloudScenarioClient {
    http: reqwest::Client,
    api_key: String,
    settings: Option<Arc<dyn RuntimeSettingsRepository>>,
}

impl ReqwestCloudScenarioClient {
    pub fn new(api_key: String) -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("reqwest client"),
            api_key,
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

    async fn bearer_token(&self) -> Option<String> {
        if let Some(repo) = &self.settings {
            if let Ok(s) = repo.load().await {
                if let Some(code) = s.auth_code.filter(|c| !c.trim().is_empty()) {
                    return Some(code);
                }
            }
        }
        if !self.api_key.trim().is_empty() {
            return Some(self.api_key.clone());
        }
        None
    }

    fn apply_auth(
        &self,
        req: reqwest::RequestBuilder,
        token: Option<String>,
    ) -> reqwest::RequestBuilder {
        if let Some(t) = token {
            req.bearer_auth(t)
        } else {
            req
        }
    }

    fn url(base: &str, path: &str) -> String {
        format!("{}/v1{}", base.trim_end_matches('/'), path)
    }
}

impl Default for ReqwestCloudScenarioClient {
    fn default() -> Self {
        Self::new(String::new())
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ScenarioDto {
    id: String,
    name: String,
    description: Option<String>,
    house_id: String,
    creator_id: String,
    definition: Value,
    status: String,
    created_at: String,
    updated_at: String,
}

impl From<ScenarioDto> for RemoteScenario {
    fn from(d: ScenarioDto) -> Self {
        RemoteScenario {
            cloud_id: d.id,
            name: d.name,
            description: d.description,
            house_id: d.house_id,
            creator_id: d.creator_id,
            definition: d.definition,
            status: d.status,
            created_at: d.created_at,
            updated_at: d.updated_at,
        }
    }
}

#[derive(Deserialize)]
struct PageDto {
    items: Vec<ScenarioDto>,
    #[allow(dead_code)]
    total: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CreateScenarioRequest {
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    house_id: String,
    creator_id: String,
    definition: Value,
    status: String,
}

#[async_trait]
impl CloudScenarioClient for ReqwestCloudScenarioClient {
    async fn list_all(&self, base_url: &str) -> Result<Vec<RemoteScenario>, DomainError> {
        let mut all: Vec<RemoteScenario> = Vec::new();
        let mut page: usize = 1;

        let token = self.bearer_token().await;

        loop {
            let url = Self::url(base_url, &format!("/scenarios?page={}&limit=100", page));
            let res = self
                .apply_auth(self.http.get(&url), token.clone())
                .send()
                .await
                .map_err(|e| DomainError::DependencyUnavailable(format!("scenario list: {e}")))?;

            if !res.status().is_success() {
                let status = res.status();
                let body = res.text().await.unwrap_or_default();
                return Err(DomainError::DependencyUnavailable(format!(
                    "scenario-service list {status}: {body}"
                )));
            }

            let page_data = res
                .json::<PageDto>()
                .await
                .map_err(|e| DomainError::Internal(format!("parse scenarios: {e}")))?;

            let fetched = page_data.items.len();
            all.extend(page_data.items.into_iter().map(RemoteScenario::from));

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
        cmd: CreateCloudScenarioCmd,
    ) -> Result<RemoteScenario, DomainError> {
        let url = Self::url(base_url, "/scenarios");
        let body = CreateScenarioRequest {
            name: cmd.name,
            description: cmd.description,
            house_id: cmd.house_id,
            creator_id: cmd.creator_id,
            definition: cmd.definition,
            status: cmd.status,
        };

        let token = self.bearer_token().await;
        let res = self
            .apply_auth(self.http.post(&url).json(&body), token)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("scenario create: {e}")))?;

        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "scenario-service create {status}: {body}"
            )));
        }

        res.json::<ScenarioDto>()
            .await
            .map(RemoteScenario::from)
            .map_err(|e| DomainError::Internal(format!("parse created scenario: {e}")))
    }
}