use async_trait::async_trait;

use local_server_core::DomainError;

#[derive(Debug, Clone)]
pub struct AuthSessionStartResult {
    pub auth_session_id: String,
    pub user_code: String,
    pub verification_url: String,
    pub expires_in: u64,
    pub poll_interval: u64,
}

#[derive(Debug, Clone)]
pub enum AuthPollResult {
    Pending,
    Authorized {
        auth_code: String,
        external_user_id: Option<String>,
        display_name: Option<String>,
    },
    Denied,
    Expired,
}

#[derive(Debug, Clone)]
pub struct CompleteAuthArgs {
    pub user_code: String,
    pub external_user_id: String,
    pub display_name: Option<String>,
}

#[async_trait]
pub trait CloudAuthClient: Send + Sync {
    async fn start_session(
        &self,
        access_service_url: &str,
        callback_url: Option<&str>,
        serial_number: Option<&str>,
    ) -> Result<AuthSessionStartResult, DomainError>;
    async fn poll_session(
        &self,
        access_service_url: &str,
        session_id: &str,
    ) -> Result<AuthPollResult, DomainError>;
    async fn complete_session(
        &self,
        access_service_url: &str,
        args: CompleteAuthArgs,
    ) -> Result<(), DomainError>;
    async fn logout_session(
        &self,
        access_service_url: &str,
        session_id: &str,
    ) -> Result<(), DomainError>;
}
