use async_trait::async_trait;
use chrono::Utc;
use local_server_application::ports::{
    AccessSyncRepository, RemoteAccessRight, RemoteHouse, RemoteHouseMember, RemoteHouseRole,
    RemoteResource, RemoteRoom, SyncStatus,
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
INSERT INTO houses(id, name, avatar_url, plan_url, address, conflict_strategy, owner_id, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, 'DENY_OVERRIDES', ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  name             = excluded.name,
  avatar_url       = excluded.avatar_url,
  plan_url         = excluded.plan_url,
  address          = excluded.address,
  owner_id         = excluded.owner_id,
  updated_at       = excluded.updated_at
"#,
            )
            .bind(&h.id)
            .bind(&h.name)
            .bind(&h.avatar_url)
            .bind(&h.plan_url)
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
SELECT h.id, h.name, h.avatar_url, h.plan_url, h.address, h.owner_id, h.created_at, h.updated_at
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
                plan_url: r.get("plan_url"),
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
            sqlx::query(
                "INSERT INTO users(id, external_user_id, display_name, created_at) \
                 VALUES(?,?,?,?) \
                 ON CONFLICT(id) DO UPDATE SET \
                   display_name = COALESCE(excluded.display_name, display_name)",
            )
            .bind(&m.user_id)
            .bind(&m.user_id)
            .bind(&m.user_display_name)
            .bind(&now)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

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

    async fn upsert_resources(
        &self,
        _house_id: &str,
        resources: &[RemoteResource],
    ) -> Result<(), DomainError> {
        // Insert in ascending depth order so parent rows always exist before children.
        let mut sorted: Vec<&RemoteResource> = resources.iter().collect();
        sorted.sort_by_key(|r| r.depth);

        for r in sorted {
            sqlx::query(
                r#"
INSERT INTO resources(id, type, name, external_id, path, depth, house_id, parent_id)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  type      = excluded.type,
  name      = excluded.name,
  path      = excluded.path,
  house_id  = excluded.house_id,
  parent_id = excluded.parent_id
"#,
            )
            .bind(&r.id)
            .bind(&r.r#type)
            .bind(&r.name)
            .bind(&r.external_id)
            .bind(&r.path)
            .bind(r.depth as i64)
            .bind(&r.house_id)
            .bind(&r.parent_id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        }
        Ok(())
    }

    async fn upsert_access_rights(
        &self,
        user_external_id: &str,
        rights: &[RemoteAccessRight],
    ) -> Result<(), DomainError> {
        let now = Utc::now().to_rfc3339();

        for r in rights {
            let local_member_id: Option<String> = if let Some(cloud_member_id) = &r.house_member_id
            {
                sqlx::query_scalar(
                    r#"
SELECT hm.id
FROM   house_members hm
JOIN   cloud_house_members chm
       ON  chm.user_id  = hm.user_id
       AND chm.house_id = hm.house_id
WHERE  chm.id = ?
LIMIT  1
"#,
                )
                .bind(cloud_member_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(db_err)?
                .flatten()
            } else {
                None
            };

            let role_id = r.role_id.as_deref();

            if local_member_id.is_none() && role_id.is_none() {
                tracing::debug!(
                    right_id = %r.id,
                    user = %user_external_id,
                    "upsert_access_rights: skipping right with unresolvable member/role"
                );
                continue;
            }

            // Check the target resource is known locally (it may not be synced yet).
            let resource_exists: bool = sqlx::query_scalar(
                "SELECT COUNT(*) FROM resources WHERE id = ?",
            )
            .bind(&r.resource_id)
            .fetch_one(&self.pool)
            .await
            .map_err(db_err)
            .map(|c: i64| c > 0)
            .unwrap_or(false);

            if !resource_exists {
                tracing::debug!(
                    right_id = %r.id,
                    resource_id = %r.resource_id,
                    "upsert_access_rights: skipping right for unknown resource"
                );
                continue;
            }

            sqlx::query(
                r#"
INSERT INTO access_rights(id, access_right_type, resource_id, house_member_id, role_id, created_at)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  access_right_type = excluded.access_right_type,
  house_member_id   = excluded.house_member_id,
  role_id           = excluded.role_id
"#,
            )
            .bind(&r.id)
            .bind(&r.access_right_type)
            .bind(&r.resource_id)
            .bind(&local_member_id)
            .bind(role_id)
            .bind(&now)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        }
        Ok(())
    }
}