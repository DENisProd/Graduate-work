use async_trait::async_trait;

use local_server_core::DomainError;

/// A user that can authenticate against the local server with a password.
#[derive(Debug, Clone)]
pub struct LocalAuthUser {
    pub id: String,
    pub external_user_id: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    /// True until the user has changed their default password.
    pub must_change_password: bool,
    /// True for the cloud linker (the user who paired this server).
    pub is_owner: bool,
}

/// Local password authentication. Passwords are issued during cloud sync —
/// every synced user receives the shared default, and the linker is forced to
/// change it.
#[async_trait]
pub trait LocalAuthRepository: Send + Sync {
    /// Issue `default_password` to any user that has no password yet, and force
    /// the cloud linker (resolved from runtime settings) to change theirs.
    /// Idempotent — never overwrites an existing password.
    async fn ensure_defaults(&self, default_password: &str) -> Result<(), DomainError>;

    /// All users known locally, for the login picker.
    async fn list_users(&self) -> Result<Vec<LocalAuthUser>, DomainError>;

    /// Verify credentials. Returns the user on success, `None` on bad password
    /// or unknown user. `identifier` matches either the local id or the
    /// external user id.
    async fn verify_credentials(
        &self,
        identifier: &str,
        password: &str,
    ) -> Result<Option<LocalAuthUser>, DomainError>;

    /// Change a user's password after verifying the current one. Clears the
    /// `must_change_password` flag.
    async fn change_password(
        &self,
        identifier: &str,
        current_password: &str,
        new_password: &str,
    ) -> Result<LocalAuthUser, DomainError>;
}
