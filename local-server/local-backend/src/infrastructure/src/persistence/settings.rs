use async_trait::async_trait;
use chrono::Utc;
use local_server_application::ports::{RuntimeSettings, RuntimeSettingsRepository};
use local_server_core::DomainError;
use sqlx::SqlitePool;

const KEY_ACCESS_SERVICE_URL: &str = "access_service_url";
const KEY_MQTT_USERNAME: &str = "mqtt_username";
const KEY_MQTT_PASSWORD: &str = "mqtt_password";
const KEY_AUTH_SESSION_ID: &str = "auth_session_id";
const KEY_AUTH_STATUS: &str = "auth_status";
const KEY_AUTH_CODE: &str = "auth_code";
const KEY_AUTH_EXTERNAL_USER_ID: &str = "auth_external_user_id";
const KEY_AUTH_DISPLAY_NAME: &str = "auth_display_name";
const KEY_AUTH_EXPIRES_AT: &str = "auth_expires_at";

pub struct SqliteRuntimeSettingsRepo {
    pool: SqlitePool,
}

impl SqliteRuntimeSettingsRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    async fn get_value(&self, key: &str) -> Result<Option<String>, DomainError> {
        sqlx::query_scalar::<_, Option<String>>("SELECT value FROM app_settings WHERE key = ?")
            .bind(key)
            .fetch_optional(&self.pool)
            .await
            .map_err(db_err)
            .map(|x| x.flatten())
    }

    async fn set_value(&self, key: &str, value: Option<&str>) -> Result<(), DomainError> {
        let now = Utc::now().to_rfc3339();
        sqlx::query(
            r#"
INSERT INTO app_settings(key, value, updated_at)
VALUES (?, ?, ?)
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = excluded.updated_at
"#,
        )
        .bind(key)
        .bind(value)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;
        Ok(())
    }
}

fn db_err(e: sqlx::Error) -> DomainError {
    DomainError::Internal(e.to_string())
}

#[async_trait]
impl RuntimeSettingsRepository for SqliteRuntimeSettingsRepo {
    async fn load(&self) -> Result<RuntimeSettings, DomainError> {
        Ok(RuntimeSettings {
            access_service_url: self.get_value(KEY_ACCESS_SERVICE_URL).await?,
            mqtt_username: self.get_value(KEY_MQTT_USERNAME).await?,
            mqtt_password: self.get_value(KEY_MQTT_PASSWORD).await?,
            auth_session_id: self.get_value(KEY_AUTH_SESSION_ID).await?,
            auth_status: self.get_value(KEY_AUTH_STATUS).await?,
            auth_code: self.get_value(KEY_AUTH_CODE).await?,
            auth_external_user_id: self.get_value(KEY_AUTH_EXTERNAL_USER_ID).await?,
            auth_display_name: self.get_value(KEY_AUTH_DISPLAY_NAME).await?,
            auth_expires_at: self.get_value(KEY_AUTH_EXPIRES_AT).await?,
        })
    }

    async fn set_access_service_url(&self, value: Option<&str>) -> Result<(), DomainError> {
        self.set_value(KEY_ACCESS_SERVICE_URL, value).await
    }

    async fn set_mqtt_username(&self, value: Option<&str>) -> Result<(), DomainError> {
        self.set_value(KEY_MQTT_USERNAME, value).await
    }

    async fn set_mqtt_password(&self, value: Option<&str>) -> Result<(), DomainError> {
        self.set_value(KEY_MQTT_PASSWORD, value).await
    }

    async fn save_auth_session(
        &self,
        session_id: &str,
        status: &str,
        auth_code: Option<&str>,
        external_user_id: Option<&str>,
        display_name: Option<&str>,
        expires_at: Option<&str>,
    ) -> Result<(), DomainError> {
        self.set_value(KEY_AUTH_SESSION_ID, Some(session_id)).await?;
        self.set_value(KEY_AUTH_STATUS, Some(status)).await?;
        self.set_value(KEY_AUTH_CODE, auth_code).await?;
        self.set_value(KEY_AUTH_EXTERNAL_USER_ID, external_user_id).await?;
        self.set_value(KEY_AUTH_DISPLAY_NAME, display_name).await?;
        self.set_value(KEY_AUTH_EXPIRES_AT, expires_at).await?;
        Ok(())
    }

    async fn clear_auth_session(&self) -> Result<(), DomainError> {
        self.set_value(KEY_AUTH_SESSION_ID, None).await?;
        self.set_value(KEY_AUTH_STATUS, None).await?;
        self.set_value(KEY_AUTH_CODE, None).await?;
        self.set_value(KEY_AUTH_EXTERNAL_USER_ID, None).await?;
        self.set_value(KEY_AUTH_DISPLAY_NAME, None).await?;
        self.set_value(KEY_AUTH_EXPIRES_AT, None).await?;
        Ok(())
    }
}