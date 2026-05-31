use async_trait::async_trait;

use local_server_core::DomainError;

#[derive(Debug, Clone, Default)]
pub struct RuntimeSettings {
    pub access_service_url: Option<String>,
    pub auth_session_id: Option<String>,
    pub auth_status: Option<String>,
    pub auth_code: Option<String>,
    pub auth_external_user_id: Option<String>,
    pub auth_display_name: Option<String>,
    pub auth_expires_at: Option<String>,
}

#[async_trait]
pub trait RuntimeSettingsRepository: Send + Sync {
    async fn load(&self) -> Result<RuntimeSettings, DomainError>;
    async fn set_access_service_url(&self, value: Option<&str>) -> Result<(), DomainError>;
    async fn save_auth_session(
        &self,
        session_id: &str,
        status: &str,
        auth_code: Option<&str>,
        external_user_id: Option<&str>,
        display_name: Option<&str>,
        expires_at: Option<&str>,
    ) -> Result<(), DomainError>;
    async fn clear_auth_session(&self) -> Result<(), DomainError>;
}
