use chrono::{DateTime, Utc};

/// Returns `true` if the remote entry should overwrite the local one.
/// Strategy: last-write-wins; on tie, cloud wins.
pub fn should_apply_remote(
    local_updated_at: Option<DateTime<Utc>>,
    remote_updated_at: DateTime<Utc>,
) -> bool {
    match local_updated_at {
        None => true,
        Some(local) => remote_updated_at >= local,
    }
}
