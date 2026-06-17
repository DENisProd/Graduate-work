use std::sync::Arc;

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use local_server_application::ports::{
    CloudSyncClient, RemoteAccessRight, RemoteHouse, RemoteHouseMember, RemoteHouseRole,
    RemoteResource, RemoteRoom, RuntimeSettingsRepository, SyncEntry,
};
use local_server_core::DomainError;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct ReqwestCloudSyncClient {
    http: reqwest::Client,
    api_key: String,
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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct HouseDto {
    id: String,
    name: String,
    avatar_url: Option<String>,
    plan_url: Option<String>,
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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct HouseRoleDto {
    id: String,
    name: String,
    house_id: String,
    priority: i32,
    is_system: bool,
}

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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResourceTreeNodeDto {
    id: String,
    house_id: String,
    #[serde(rename = "type")]
    resource_type: String,
    name: Option<String>,
    external_id: Option<String>,
    parent_id: Option<String>,
    path: String,
    depth: i32,
    #[serde(default)]
    children: Vec<ResourceTreeNodeDto>,
}

impl ResourceTreeNodeDto {
    fn flatten(self) -> Vec<RemoteResource> {
        let mut out = Vec::new();
        Self::collect(self, &mut out);
        out
    }

    fn collect(node: ResourceTreeNodeDto, out: &mut Vec<RemoteResource>) {
        out.push(RemoteResource {
            id: node.id,
            r#type: node.resource_type,
            name: node.name,
            external_id: node.external_id,
            path: node.path,
            depth: node.depth,
            house_id: node.house_id,
            parent_id: node.parent_id,
        });
        for child in node.children {
            Self::collect(child, out);
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AccessRightDto {
    id: String,
    resource_id: String,
    house_member_id: Option<String>,
    role_id: Option<String>,
    access_right_type: String,
    expires_at: Option<String>,
}

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
                plan_url: d.plan_url,
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

    async fn fetch_house_resources(
        &self,
        base_url: &str,
        house_id: &str,
    ) -> Result<Vec<RemoteResource>, DomainError> {
        let url = Self::url(base_url, &format!("/houses/{house_id}/resources/tree"));
        let token = self.bearer_token().await;
        let res = self
            .http
            .get(&url)
            .bearer_auth(&token)
            .send()
            .await
            .map_err(|e| {
                DomainError::DependencyUnavailable(format!("fetch_house_resources: {e}"))
            })?;

        let status = res.status();
        if !status.is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "access-service resources {status}: {body}"
            )));
        }

        let nodes = res
            .json::<Vec<ResourceTreeNodeDto>>()
            .await
            .map_err(|e| DomainError::Internal(format!("parse resources: {e}")))?;

        let flat = nodes.into_iter().flat_map(|n| n.flatten()).collect();
        Ok(flat)
    }

    async fn fetch_user_access_rights(
        &self,
        base_url: &str,
        user_id: &str,
    ) -> Result<Vec<RemoteAccessRight>, DomainError> {
        let url = Self::url(base_url, &format!("/access-rights/user/{user_id}"));
        let token = self.bearer_token().await;
        let res = self
            .http
            .get(&url)
            .bearer_auth(&token)
            .header("X-User-Id", user_id)
            .send()
            .await
            .map_err(|e| {
                DomainError::DependencyUnavailable(format!("fetch_user_access_rights: {e}"))
            })?;

        let status = res.status();
        if !status.is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "access-service access-rights {status}: {body}"
            )));
        }

        let dtos = res
            .json::<Vec<AccessRightDto>>()
            .await
            .map_err(|e| DomainError::Internal(format!("parse access rights: {e}")))?;

        Ok(dtos
            .into_iter()
            .map(|d| RemoteAccessRight {
                id: d.id,
                resource_id: d.resource_id,
                house_member_id: d.house_member_id,
                role_id: d.role_id,
                access_right_type: d.access_right_type,
                expires_at: d.expires_at,
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
        let token = if api_key.trim().is_empty() {
            self.bearer_token().await
        } else {
            api_key.to_string()
        };
        let res = self
            .http
            .post(&url)
            .bearer_auth(&token)
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