use std::sync::Arc;

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use local_server_application::ports::{
    CloudSyncClient, RemoteHouse, RemoteHouseMember, RemoteHouseRole, RemoteRoom,
    RuntimeSettingsRepository, SyncEntry,
};
use local_server_core::DomainError;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct ReqwestCloudSyncClient {
    http: reqwest::Client,
    /// Fallback static key (used when runtime settings have no auth_code).
    api_key: String,
    /// Provides the dynamic auth_code obtained via device authorization flow.
    settings: Option<Arc<dyn RuntimeSettingsRepository>>,
}

impl ReqwestCloudSyncClient {
    pub fn new(api_key: String) -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("reqwest client should build"),
            api_key,
            settings: None,
        }
    }

    pub fn with_settings(api_key: String, settings: Arc<dyn RuntimeSettingsRepository>) -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("reqwest client should build"),
            api_key,
            settings: Some(settings),
        }
    }

    /// Returns the current bearer token: auth_code from runtime settings if
    /// available and non-empty, otherwise falls back to the static api_key.
    async fn bearer_token(&self) -> String {
        if let Some(repo) = &self.settings {
            if let Ok(s) = repo.load().await {
                if let Some(code) = s.auth_code.filter(|c| !c.trim().is_empty()) {
                    return code;
                }
            }
        }
        self.api_key.clone()
    }

    fn url(base: &str, path: &str) -> String {
        format!("{}/api/access/v1{}", base.trim_end_matches('/'), path)
    }
}

// ── access-service response shapes ────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct HouseDto {
    id: String,
    name: String,
    avatar_url: Option<String>,
    address: Option<String>,
    owner_id: String,
    created_at: String,
    updated_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct HouseRoomDto {
    id: String,
    name: String,
    house_id: String,
    created_at: String,
}

// ── access-service role response shape ────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct HouseRoleDto {
    id: String,
    name: String,
    house_id: String,
    priority: i32,
    is_system: bool,
}

// ── access-service member response shape ─────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct MemberRoleBriefDto {
    role_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct HouseMemberDto {
    id: String,
    user_id: String,
    user_display_name: Option<String>,
    user_avatar_url: Option<String>,
    joined_at: String,
    #[serde(default)]
    roles: Vec<MemberRoleBriefDto>,
}

// ── trait impl ────────────────────────────────────────────────────────────────

#[async_trait]
impl CloudSyncClient for ReqwestCloudSyncClient {
    async fn fetch_user_houses(
        &self,
        base_url: &str,
        user_id: &str,
    ) -> Result<Vec<RemoteHouse>, DomainError> {
        let url = Self::url(base_url, &format!("/houses/user/{user_id}"));
        let token = self.bearer_token().await;
        let res = self
            .http
            .get(&url)
            .bearer_auth(&token)
            .header("X-User-Id", user_id)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("fetch_user_houses: {e}")))?;

        let status = res.status();
        if !status.is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "access-service houses {status}: {body}"
            )));
        }

        let dtos = res
            .json::<Vec<HouseDto>>()
            .await
            .map_err(|e| DomainError::Internal(format!("parse houses: {e}")))?;

        Ok(dtos
            .into_iter()
            .map(|d| RemoteHouse {
                id: d.id,
                name: d.name,
                avatar_url: d.avatar_url,
                address: d.address,
                owner_id: d.owner_id,
                created_at: d.created_at,
                updated_at: d.updated_at,
            })
            .collect())
    }

    async fn fetch_house_rooms(
        &self,
        base_url: &str,
        house_id: &str,
    ) -> Result<Vec<RemoteRoom>, DomainError> {
        let url = Self::url(base_url, &format!("/house-rooms/house/{house_id}"));
        let token = self.bearer_token().await;
        let res = self
            .http
            .get(&url)
            .bearer_auth(&token)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("fetch_house_rooms: {e}")))?;

        let status = res.status();
        if !status.is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "access-service rooms {status}: {body}"
            )));
        }

        let dtos = res
            .json::<Vec<HouseRoomDto>>()
            .await
            .map_err(|e| DomainError::Internal(format!("parse rooms: {e}")))?;

        Ok(dtos
            .into_iter()
            .map(|d| RemoteRoom {
                id: d.id,
                name: d.name,
                house_id: d.house_id,
                created_at: d.created_at,
            })
            .collect())
    }

    async fn fetch_house_members(
        &self,
        base_url: &str,
        house_id: &str,
    ) -> Result<Vec<RemoteHouseMember>, DomainError> {
        let url = Self::url(base_url, &format!("/house-members/house/{house_id}"));
        let token = self.bearer_token().await;
        let res = self
            .http
            .get(&url)
            .bearer_auth(&token)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("fetch_house_members: {e}")))?;

        let status = res.status();
        if !status.is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "access-service members {status}: {body}"
            )));
        }

        let dtos = res
            .json::<Vec<HouseMemberDto>>()
            .await
            .map_err(|e| DomainError::Internal(format!("parse members: {e}")))?;

        Ok(dtos
            .into_iter()
            .map(|d| RemoteHouseMember {
                id: d.id,
                user_id: d.user_id,
                house_id: house_id.to_string(),
                user_display_name: d.user_display_name,
                user_avatar_url: d.user_avatar_url,
                joined_at: d.joined_at,
                role_ids: d.roles.into_iter().map(|r| r.role_id).collect(),
            })
            .collect())
    }

    async fn fetch_house_roles(
        &self,
        base_url: &str,
        house_id: &str,
    ) -> Result<Vec<RemoteHouseRole>, DomainError> {
        let url = Self::url(base_url, &format!("/house-roles/house/{house_id}"));
        let token = self.bearer_token().await;
        let res = self
            .http
            .get(&url)
            .bearer_auth(&token)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("fetch_house_roles: {e}")))?;

        let status = res.status();
        if !status.is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "access-service roles {status}: {body}"
            )));
        }

        let dtos = res
            .json::<Vec<HouseRoleDto>>()
            .await
            .map_err(|e| DomainError::Internal(format!("parse roles: {e}")))?;

        Ok(dtos
            .into_iter()
            .map(|d| RemoteHouseRole {
                id: d.id,
                name: d.name,
                priority: d.priority,
                is_system: d.is_system,
                house_id: d.house_id,
            })
            .collect())
    }

    async fn ingest(
        &self,
        base_url: &str,
        api_key: &str,
        entries: Vec<SyncEntry>,
    ) -> Result<(), DomainError> {
        if entries.is_empty() {
            return Ok(());
        }
        #[derive(Serialize)]
        struct IngestRequest {
            entries: Vec<SyncEntry>,
        }
        let url = Self::url(base_url, "/sync/ingest");
        let res = self
            .http
            .post(&url)
            .bearer_auth(api_key)
            .json(&IngestRequest { entries })
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("sync ingest: {e}")))?;

        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "cloud ingest {status}: {body}"
            )));
        }
        Ok(())
    }

    async fn delta(
        &self,
        base_url: &str,
        api_key: &str,
        since: DateTime<Utc>,
    ) -> Result<Vec<SyncEntry>, DomainError> {
        let url = Self::url(
            base_url,
            &format!("/sync/delta?since={}", since.to_rfc3339()),
        );
        let res = self
            .http
            .get(&url)
            .bearer_auth(api_key)
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("sync delta: {e}")))?;

        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "cloud delta {status}: {body}"
            )));
        }

        res.json::<Vec<SyncEntry>>()
            .await
            .map_err(|e| DomainError::Internal(format!("parse delta: {e}")))
    }
}
