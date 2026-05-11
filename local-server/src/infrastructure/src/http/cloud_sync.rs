use async_trait::async_trait;
use chrono::{DateTime, Utc};
use local_server_application::ports::{CloudSyncClient, RemoteHouse, RemoteRoom, SyncEntry};
use local_server_core::DomainError;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct ReqwestCloudSyncClient {
    http: reqwest::Client,
}

impl ReqwestCloudSyncClient {
    pub fn new() -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("reqwest client should build"),
        }
    }

    fn url(base: &str, path: &str) -> String {
        format!("{}/api/v1{}", base.trim_end_matches('/'), path)
    }
}

impl Default for ReqwestCloudSyncClient {
    fn default() -> Self {
        Self::new()
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

// ── trait impl ────────────────────────────────────────────────────────────────

#[async_trait]
impl CloudSyncClient for ReqwestCloudSyncClient {
    async fn fetch_user_houses(
        &self,
        base_url: &str,
        user_id: &str,
    ) -> Result<Vec<RemoteHouse>, DomainError> {
        let url = Self::url(base_url, &format!("/houses/user/{user_id}"));
        let res = self
            .http
            .get(&url)
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
        let res = self
            .http
            .get(&url)
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
