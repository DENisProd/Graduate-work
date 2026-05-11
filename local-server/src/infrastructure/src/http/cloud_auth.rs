use async_trait::async_trait;
use local_server_application::ports::{
    AuthPollResult, AuthSessionStartResult, CloudAuthClient, CompleteAuthArgs,
};
use local_server_core::DomainError;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct ReqwestCloudAuthClient {
    http: reqwest::Client,
}

impl ReqwestCloudAuthClient {
    pub fn new() -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(10))
                .build()
                .expect("reqwest client should build"),
        }
    }

    fn url(base: &str, path: &str) -> String {
        format!("{}/api/v1{}", base.trim_end_matches('/'), path)
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StartSessionRequest {
    callback_url: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartSessionResponse {
    auth_session_id: String,
    user_code: String,
    verification_url: String,
    expires_in: u64,
    poll_interval: u64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PollResponse {
    status: String,
    auth_code: Option<String>,
    external_user_id: Option<String>,
    display_name: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CompleteSessionRequest {
    user_code: String,
    external_user_id: String,
    display_name: Option<String>,
}

#[async_trait]
impl CloudAuthClient for ReqwestCloudAuthClient {
    async fn start_session(
        &self,
        access_service_url: &str,
        callback_url: Option<&str>,
    ) -> Result<AuthSessionStartResult, DomainError> {
        let res = self
            .http
            .post(Self::url(access_service_url, "/device-auth/sessions"))
            .json(&StartSessionRequest {
                callback_url: callback_url.map(str::to_string),
            })
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("access-service start_session: {e}")))?;

        let status = res.status();
        if !status.is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "access-service start_session failed: {status} {body}"
            )));
        }

        let data = res
            .json::<StartSessionResponse>()
            .await
            .map_err(|e| DomainError::Internal(format!("invalid start_session response: {e}")))?;

        Ok(AuthSessionStartResult {
            auth_session_id: data.auth_session_id,
            user_code: data.user_code,
            verification_url: data.verification_url,
            expires_in: data.expires_in,
            poll_interval: data.poll_interval,
        })
    }

    async fn poll_session(
        &self,
        access_service_url: &str,
        session_id: &str,
    ) -> Result<AuthPollResult, DomainError> {
        let res = self
            .http
            .get(Self::url(
                access_service_url,
                &format!("/device-auth/sessions/{session_id}/poll"),
            ))
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("access-service poll_session: {e}")))?;

        let status = res.status();
        if !status.is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "access-service poll_session failed: {status} {body}"
            )));
        }

        let data = res
            .json::<PollResponse>()
            .await
            .map_err(|e| DomainError::Internal(format!("invalid poll_session response: {e}")))?;

        match data.status.as_str() {
            "pending" => Ok(AuthPollResult::Pending),
            "authorized" => data
                .auth_code
                .map(|auth_code| AuthPollResult::Authorized {
                    auth_code,
                    external_user_id: data.external_user_id,
                    display_name: data.display_name,
                })
                .ok_or_else(|| DomainError::Internal("authorized poll response has no authCode".into())),
            "denied" => Ok(AuthPollResult::Denied),
            "expired" => Ok(AuthPollResult::Expired),
            other => Err(DomainError::Internal(format!("unknown auth status: {other}"))),
        }
    }

    async fn complete_session(
        &self,
        access_service_url: &str,
        args: CompleteAuthArgs,
    ) -> Result<(), DomainError> {
        let res = self
            .http
            .post(Self::url(access_service_url, "/device-auth/confirm"))
            .json(&CompleteSessionRequest {
                user_code: args.user_code,
                external_user_id: args.external_user_id,
                display_name: args.display_name,
            })
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("access-service complete_session: {e}")))?;

        let status = res.status();
        if !status.is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "access-service complete_session failed: {status} {body}"
            )));
        }
        Ok(())
    }

    async fn logout_session(
        &self,
        access_service_url: &str,
        session_id: &str,
    ) -> Result<(), DomainError> {
        let res = self
            .http
            .post(Self::url(
                access_service_url,
                &format!("/device-auth/sessions/{session_id}/logout"),
            ))
            .send()
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("access-service logout_session: {e}")))?;

        let status = res.status();
        if !status.is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(DomainError::DependencyUnavailable(format!(
                "access-service logout_session failed: {status} {body}"
            )));
        }
        Ok(())
    }
}
