use async_trait::async_trait;
use chrono::Utc;
use local_server_application::ports::{
    AccessSyncRepository, RemoteHouse, RemoteHouseMember, RemoteHouseRole, RemoteRoom, SyncStatus,
};
use local_server_core::DomainError;
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct SqliteAccessSyncRepo {
    pool: SqlitePool,
}

impl SqliteAccessSyncRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

fn db_err(e: sqlx::Error) -> DomainError {
    DomainError::Internal(e.to_string())
}

#[async_trait]
impl AccessSyncRepository for SqliteAccessSyncRepo {
    async fn upsert_owner(&self, external_user_id: &str) -> Result<(), DomainError> {
        let now = Utc::now().to_rfc3339();
        sqlx::query(
            r#"
INSERT INTO users(id, external_user_id, avatar_url, created_at)
VALUES (?, ?, NULL, ?)
ON CONFLICT(id) DO NOTHING
"#,
        )
        .bind(external_user_id)
        .bind(external_user_id)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;
        Ok(())
    }

    async fn upsert_houses(
        &self,
        houses: &[RemoteHouse],
        _owner_external_id: &str,
    ) -> Result<(), DomainError> {
        let now = Utc::now().to_rfc3339();
        for h in houses {
            // The house owner may be a different user than the authenticated one
            // (user can be a member of houses owned by others). Ensure the owner
            // exists in users before inserting with the FK constraint.
            sqlx::query(
                "INSERT INTO users(id, external_user_id, avatar_url, created_at) \
                 VALUES (?, ?, NULL, ?) ON CONFLICT(id) DO NOTHING",
            )
            .bind(&h.owner_id)
            .bind(&h.owner_id)
            .bind(&now)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

            sqlx::query(
                r#"
INSERT INTO houses(id, name, avatar_url, address, conflict_strategy, owner_id, created_at, updated_at)
VALUES (?, ?, ?, ?, 'DENY_OVERRIDES', ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  name             = excluded.name,
  avatar_url       = excluded.avatar_url,
  address          = excluded.address,
  owner_id         = excluded.owner_id,
  updated_at       = excluded.updated_at
"#,
            )
            .bind(&h.id)
            .bind(&h.name)
            .bind(&h.avatar_url)
            .bind(&h.address)
            .bind(&h.owner_id)
            .bind(&h.created_at)
            .bind(&h.updated_at)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        }
        Ok(())
    }

    async fn upsert_rooms(
        &self,
        house_id: &str,
        rooms: &[RemoteRoom],
    ) -> Result<(), DomainError> {
        for r in rooms {
            let path = format!("{}/{}", house_id, r.id);
            sqlx::query(
                r#"
INSERT INTO resources(id, type, name, external_id, path, depth, house_id, parent_id)
VALUES (?, 'ROOM', ?, NULL, ?, 1, ?, NULL)
ON CONFLICT(id) DO UPDATE SET
  name      = excluded.name,
  path      = excluded.path,
  house_id  = excluded.house_id
"#,
            )
            .bind(&r.id)
            .bind(&r.name)
            .bind(&path)
            .bind(house_id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        }
        Ok(())
    }

    async fn mark_pulled(&self, entity_type: &str, at: &str) -> Result<(), DomainError> {
        sqlx::query(
            r#"
INSERT INTO sync_versions(entity_type, last_pulled_at, last_pushed_at)
VALUES (?, ?, NULL)
ON CONFLICT(entity_type) DO UPDATE SET last_pulled_at = excluded.last_pulled_at
"#,
        )
        .bind(entity_type)
        .bind(at)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;
        Ok(())
    }

    async fn get_status(&self) -> Result<SyncStatus, DomainError> {
        let pending_outbox: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM sync_outbox WHERE sent_at IS NULL")
                .fetch_one(&self.pool)
                .await
                .map_err(db_err)?;

        // Earliest last_pulled_at across entity types (the weakest point).
        let last_pulled_at: Option<String> = sqlx::query_scalar(
            "SELECT MIN(last_pulled_at) FROM sync_versions WHERE last_pulled_at IS NOT NULL",
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?
        .flatten();

        let last_pushed_at: Option<String> = sqlx::query_scalar(
            "SELECT MAX(last_pushed_at) FROM sync_versions WHERE last_pushed_at IS NOT NULL",
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?
        .flatten();

        Ok(SyncStatus {
            pending_outbox,
            last_pulled_at,
            last_pushed_at,
        })
    }

    async fn list_houses(&self, owner_external_id: &str) -> Result<Vec<RemoteHouse>, DomainError> {
        let rows = sqlx::query(
            r#"
SELECT h.id, h.name, h.avatar_url, h.address, h.owner_id, h.created_at, h.updated_at
FROM   houses h
JOIN   users  u ON u.id = h.owner_id
WHERE  u.external_user_id = ?
ORDER  BY h.created_at ASC
"#,
        )
        .bind(owner_external_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        use sqlx::Row as _;
        Ok(rows
            .into_iter()
            .map(|r| RemoteHouse {
                id: r.get("id"),
                name: r.get("name"),
                avatar_url: r.get("avatar_url"),
                address: r.get("address"),
                owner_id: r.get("owner_id"),
                created_at: r.get("created_at"),
                updated_at: r.get("updated_at"),
            })
            .collect())
    }

    async fn upsert_members(
        &self,
        house_id: &str,
        members: &[RemoteHouseMember],
    ) -> Result<(), DomainError> {
        let now = Utc::now().to_rfc3339();
        for m in members {
            sqlx::query(
                r#"
INSERT INTO cloud_house_members(id, user_id, house_id, user_display_name, user_avatar_url, joined_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  user_display_name = excluded.user_display_name,
  user_avatar_url   = excluded.user_avatar_url,
  joined_at         = excluded.joined_at,
  updated_at        = excluded.updated_at
"#,
            )
            .bind(&m.id)
            .bind(&m.user_id)
            .bind(house_id)
            .bind(&m.user_display_name)
            .bind(&m.user_avatar_url)
            .bind(&m.joined_at)
            .bind(&now)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        }
        Ok(())
    }

    async fn upsert_rbac_roles(
        &self,
        _house_id: &str,
        roles: &[RemoteHouseRole],
    ) -> Result<(), DomainError> {
        let now = Utc::now().to_rfc3339();
        for role in roles {
            sqlx::query(
                r#"
INSERT INTO house_roles(id, name, priority, is_system, house_id, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  name      = excluded.name,
  priority  = excluded.priority,
  is_system = excluded.is_system,
  updated_at = excluded.updated_at
"#,
            )
            .bind(&role.id)
            .bind(&role.name)
            .bind(role.priority as i64)
            .bind(role.is_system as i64)
            .bind(&role.house_id)
            .bind(&now)
            .bind(&now)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        }
        Ok(())
    }

    async fn upsert_rbac_members(
        &self,
        house_id: &str,
        members: &[RemoteHouseMember],
    ) -> Result<(), DomainError> {
        let now = Utc::now().to_rfc3339();
        for m in members {
            // Ensure the user row exists (users.id = external_user_id in this schema).
            sqlx::query(
                "INSERT INTO users(id, external_user_id, created_at) VALUES(?,?,?) \
                 ON CONFLICT(id) DO NOTHING",
            )
            .bind(&m.user_id)
            .bind(&m.user_id)
            .bind(&now)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

            // Upsert the RBAC house_member row, using the cloud member ID as PK.
            sqlx::query(
                r#"
INSERT INTO house_members(id, house_id, user_id, joined_at)
VALUES (?, ?, ?, ?)
ON CONFLICT(house_id, user_id) DO UPDATE SET
  removed_at = NULL,
  joined_at  = excluded.joined_at
"#,
            )
            .bind(&m.id)
            .bind(house_id)
            .bind(&m.user_id)
            .bind(&m.joined_at)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

            // Fetch the actual local member ID (may differ when conflict resolved).
            let local_id: Option<String> = sqlx::query_scalar(
                "SELECT id FROM house_members WHERE house_id = ? AND user_id = ?",
            )
            .bind(house_id)
            .bind(&m.user_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(db_err)?;

            let local_id = match local_id {
                Some(id) => id,
                None => continue,
            };

            // Replace role assignments with the cloud state.
            sqlx::query("DELETE FROM house_member_roles WHERE house_member_id = ?")
                .bind(&local_id)
                .execute(&self.pool)
                .await
                .map_err(db_err)?;

            for role_id in &m.role_ids {
                let mr_id = Uuid::new_v4().to_string();
                sqlx::query(
                    "INSERT OR IGNORE INTO house_member_roles(id, house_member_id, role_id, assigned_at) \
                     VALUES(?, ?, ?, ?)",
                )
                .bind(&mr_id)
                .bind(&local_id)
                .bind(role_id)
                .bind(&now)
                .execute(&self.pool)
                .await
                .map_err(db_err)?;
            }
        }
        Ok(())
    }

    async fn list_rooms(&self, house_id: &str) -> Result<Vec<RemoteRoom>, DomainError> {
        // `name` was added via migration 007 — use runtime query to avoid
        // SQLx compile-time schema mismatch on older dev databases.
        let rows = sqlx::query(
            "SELECT id, name, house_id FROM resources WHERE house_id = ? AND type = 'ROOM' ORDER BY path ASC",
        )
        .bind(house_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        use sqlx::Row as _;
        Ok(rows
            .into_iter()
            .map(|r| {
                let name: Option<String> = r.get("name");
                RemoteRoom {
                    id: r.get("id"),
                    name: name.unwrap_or_default(),
                    house_id: r.get("house_id"),
                    created_at: String::new(),
                }
            })
            .collect())
    }
}
