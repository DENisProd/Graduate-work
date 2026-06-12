use async_trait::async_trait;
use local_server_application::ports::{LocalAuthRepository, LocalAuthUser};
use local_server_core::DomainError;
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use sqlx::Row as _;
use uuid::Uuid;

/// Settings key holding the external user id of the cloud linker.
const KEY_AUTH_EXTERNAL_USER_ID: &str = "auth_external_user_id";

pub struct SqliteLocalAuthRepo {
    pool: SqlitePool,
}

impl SqliteLocalAuthRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// External user id of the cloud linker, if this server has been paired.
    async fn owner_external_id(&self) -> Result<Option<String>, DomainError> {
        sqlx::query_scalar::<_, Option<String>>("SELECT value FROM app_settings WHERE key = ?")
            .bind(KEY_AUTH_EXTERNAL_USER_ID)
            .fetch_optional(&self.pool)
            .await
            .map_err(db_err)
            .map(|x| x.flatten())
    }

    async fn find_password_hash(&self, identifier: &str) -> Result<Option<String>, DomainError> {
        sqlx::query_scalar::<_, Option<String>>(
            "SELECT password_hash FROM users WHERE id = ? OR external_user_id = ? LIMIT 1",
        )
        .bind(identifier)
        .bind(identifier)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)
        .map(|x| x.flatten())
    }

    async fn load_user(
        &self,
        identifier: &str,
        owner: Option<&str>,
    ) -> Result<Option<LocalAuthUser>, DomainError> {
        let row = sqlx::query(
            "SELECT id, external_user_id, display_name, avatar_url, must_change_password \
             FROM users WHERE id = ? OR external_user_id = ? LIMIT 1",
        )
        .bind(identifier)
        .bind(identifier)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(row.map(|r| row_to_user(&r, owner)))
    }
}

fn db_err(e: sqlx::Error) -> DomainError {
    DomainError::Internal(e.to_string())
}

fn row_to_user(r: &sqlx::sqlite::SqliteRow, owner: Option<&str>) -> LocalAuthUser {
    let external_user_id: String = r.get("external_user_id");
    let is_owner = owner.is_some_and(|o| o == external_user_id);
    LocalAuthUser {
        id: r.get("id"),
        is_owner,
        must_change_password: r.get::<i64, _>("must_change_password") != 0,
        display_name: r.get("display_name"),
        avatar_url: r.get("avatar_url"),
        external_user_id,
    }
}

fn to_hex(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        out.push_str(&format!("{:02x}", b));
    }
    out
}

/// Hash a password with a fresh random salt: `sha256$<salt_hex>$<digest_hex>`.
fn hash_password(password: &str) -> String {
    let salt = Uuid::new_v4().simple().to_string();
    let digest = Sha256::digest(format!("{salt}{password}").as_bytes());
    format!("sha256${salt}${}", to_hex(&digest))
}

/// Constant-format check against a stored `sha256$salt$digest` string.
fn verify_password(stored: &str, password: &str) -> bool {
    let mut parts = stored.splitn(3, '$');
    match (parts.next(), parts.next(), parts.next()) {
        (Some("sha256"), Some(salt), Some(expected)) => {
            let digest = Sha256::digest(format!("{salt}{password}").as_bytes());
            to_hex(&digest) == expected
        }
        _ => false,
    }
}

#[async_trait]
impl LocalAuthRepository for SqliteLocalAuthRepo {
    async fn ensure_defaults(&self, default_password: &str) -> Result<(), DomainError> {
        let owner = self.owner_external_id().await?;

        // Users that have never been issued a password yet.
        let rows = sqlx::query(
            "SELECT id, external_user_id FROM users \
             WHERE password_hash IS NULL OR password_hash = ''",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        for r in rows {
            let id: String = r.get("id");
            let external_user_id: String = r.get("external_user_id");
            let is_owner = owner
                .as_deref()
                .is_some_and(|o| o == external_user_id || o == id);
            let hash = hash_password(default_password);
            sqlx::query(
                "UPDATE users SET password_hash = ?, must_change_password = ? WHERE id = ?",
            )
            .bind(&hash)
            .bind(if is_owner { 1_i64 } else { 0_i64 })
            .bind(&id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        }

        Ok(())
    }

    async fn list_users(&self) -> Result<Vec<LocalAuthUser>, DomainError> {
        let owner = self.owner_external_id().await?;
        let rows = sqlx::query(
            "SELECT id, external_user_id, display_name, avatar_url, must_change_password \
             FROM users ORDER BY COALESCE(display_name, external_user_id) ASC",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows
            .iter()
            .map(|r| row_to_user(r, owner.as_deref()))
            .collect())
    }

    async fn verify_credentials(
        &self,
        identifier: &str,
        password: &str,
    ) -> Result<Option<LocalAuthUser>, DomainError> {
        let stored = match self.find_password_hash(identifier).await? {
            Some(h) if !h.is_empty() => h,
            // Unknown user, or one that has not been issued a password yet.
            _ => return Ok(None),
        };
        if !verify_password(&stored, password) {
            return Ok(None);
        }
        let owner = self.owner_external_id().await?;
        self.load_user(identifier, owner.as_deref()).await
    }

    async fn change_password(
        &self,
        identifier: &str,
        current_password: &str,
        new_password: &str,
    ) -> Result<LocalAuthUser, DomainError> {
        if new_password.is_empty() {
            return Err(DomainError::Validation("New password must not be empty".into()));
        }
        let stored = self
            .find_password_hash(identifier)
            .await?
            .filter(|h| !h.is_empty())
            .ok_or_else(|| DomainError::not_found("user", identifier))?;
        if !verify_password(&stored, current_password) {
            return Err(DomainError::Validation("Current password is incorrect".into()));
        }

        let hash = hash_password(new_password);
        sqlx::query(
            "UPDATE users SET password_hash = ?, must_change_password = 0 \
             WHERE id = ? OR external_user_id = ?",
        )
        .bind(&hash)
        .bind(identifier)
        .bind(identifier)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        let owner = self.owner_external_id().await?;
        self.load_user(identifier, owner.as_deref())
            .await?
            .ok_or_else(|| DomainError::not_found("user", identifier))
    }
}
