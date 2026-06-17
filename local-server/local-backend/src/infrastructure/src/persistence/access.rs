use std::str::FromStr;

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use local_server_application::ports::access_repository::*;
use local_server_application::DomainError;
use local_server_core::entities::access::*;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

fn db_err(e: sqlx::Error) -> DomainError {
    DomainError::Internal(e.to_string())
}

fn parse_dt(s: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(s)
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now())
}

fn opt_dt(s: Option<String>) -> Option<DateTime<Utc>> {
    s.map(|v| parse_dt(&v))
}

pub struct SqliteAccessRepo {
    pool: SqlitePool,
}

impl SqliteAccessRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl AccessRepository for SqliteAccessRepo {
    async fn find_house(&self, id: &str) -> Result<Option<House>, DomainError> {
        let row = sqlx::query(
            "SELECT id, name, avatar_url, plan_url, address, conflict_strategy, owner_id, created_at, updated_at \
             FROM houses WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(row.map(|r| House {
            id: r.get("id"),
            name: r.get("name"),
            avatar_url: r.get("avatar_url"),
            plan_url: r.get("plan_url"),
            address: r.get("address"),
            conflict_strategy: ConflictStrategy::from_str(
                r.get::<String, _>("conflict_strategy").as_str(),
            )
            .unwrap_or(ConflictStrategy::DenyOverrides),
            owner_id: r.get("owner_id"),
            created_at: parse_dt(&r.get::<String, _>("created_at")),
            updated_at: parse_dt(&r.get::<String, _>("updated_at")),
        }))
    }

    async fn list_houses_for_user(
        &self,
        external_user_id: &str,
    ) -> Result<Vec<House>, DomainError> {
        let rows = sqlx::query(
            "SELECT h.id, h.name, h.avatar_url, h.plan_url, h.address, h.conflict_strategy, \
             h.owner_id, h.created_at, h.updated_at \
             FROM houses h \
             JOIN users u ON u.id = h.owner_id \
             WHERE u.external_user_id = ? \
             ORDER BY h.created_at ASC",
        )
        .bind(external_user_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows
            .into_iter()
            .map(|r| House {
                id: r.get("id"),
                name: r.get("name"),
                avatar_url: r.get("avatar_url"),
                plan_url: r.get("plan_url"),
                address: r.get("address"),
                conflict_strategy: ConflictStrategy::from_str(
                    r.get::<String, _>("conflict_strategy").as_str(),
                )
                .unwrap_or(ConflictStrategy::DenyOverrides),
                owner_id: r.get("owner_id"),
                created_at: parse_dt(&r.get::<String, _>("created_at")),
                updated_at: parse_dt(&r.get::<String, _>("updated_at")),
            })
            .collect())
    }

    async fn create_house(&self, cmd: CreateHouseCmd) -> Result<House, DomainError> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT INTO users(id, external_user_id, created_at) VALUES(?,?,?) \
             ON CONFLICT(id) DO NOTHING",
        )
        .bind(&cmd.owner_external_user_id)
        .bind(&cmd.owner_external_user_id)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        sqlx::query(
            "INSERT INTO houses(id, name, avatar_url, plan_url, address, conflict_strategy, owner_id, created_at, updated_at) \
             VALUES(?,?,?,?,?,'DENY_OVERRIDES',?,?,?)",
        )
        .bind(&id)
        .bind(&cmd.name)
        .bind(&cmd.avatar_url)
        .bind(&cmd.plan_url)
        .bind(&cmd.address)
        .bind(&cmd.owner_external_user_id)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        self.find_house(&id)
            .await?
            .ok_or_else(|| DomainError::not_found("house", &id))
    }

    async fn update_house(&self, id: &str, cmd: UpdateHouseCmd) -> Result<House, DomainError> {
        let house = self
            .find_house(id)
            .await?
            .ok_or_else(|| DomainError::not_found("house", id))?;

        let name = cmd.name.unwrap_or(house.name);
        let avatar_url = cmd.avatar_url.or(house.avatar_url);
        let plan_url = cmd.plan_url.or(house.plan_url);
        let address = cmd.address.or(house.address);
        let strategy = cmd
            .conflict_strategy
            .unwrap_or_else(|| house.conflict_strategy.as_str().to_owned());
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "UPDATE houses SET name=?, avatar_url=?, plan_url=?, address=?, conflict_strategy=?, updated_at=? WHERE id=?",
        )
        .bind(&name)
        .bind(&avatar_url)
        .bind(&plan_url)
        .bind(&address)
        .bind(&strategy)
        .bind(&now)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        self.find_house(id)
            .await?
            .ok_or_else(|| DomainError::not_found("house", id))
    }

    async fn delete_house(&self, id: &str) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM houses WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn find_member(&self, id: &str) -> Result<Option<HouseMember>, DomainError> {
        let row = sqlx::query(
            "SELECT hm.id, hm.house_id, hm.user_id, u.external_user_id, hm.joined_at, hm.removed_at \
             FROM house_members hm \
             LEFT JOIN users u ON u.id = hm.user_id \
             WHERE hm.id = ?",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(row.map(|r| HouseMember {
            id: r.get("id"),
            house_id: r.get("house_id"),
            user_id: r.get("user_id"),
            external_user_id: r.get("external_user_id"),
            joined_at: parse_dt(&r.get::<String, _>("joined_at")),
            removed_at: opt_dt(r.get("removed_at")),
        }))
    }

    async fn find_member_by_user_in_house(
        &self,
        external_user_id: &str,
        house_id: &str,
    ) -> Result<Option<HouseMember>, DomainError> {
        let row = sqlx::query(
            "SELECT hm.id, hm.house_id, hm.user_id, u.external_user_id, hm.joined_at, hm.removed_at \
             FROM house_members hm \
             JOIN users u ON u.id = hm.user_id \
             WHERE u.external_user_id = ? AND hm.house_id = ? AND hm.removed_at IS NULL",
        )
        .bind(external_user_id)
        .bind(house_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(row.map(|r| HouseMember {
            id: r.get("id"),
            house_id: r.get("house_id"),
            user_id: r.get("user_id"),
            external_user_id: r.get("external_user_id"),
            joined_at: parse_dt(&r.get::<String, _>("joined_at")),
            removed_at: opt_dt(r.get("removed_at")),
        }))
    }

    async fn list_members(&self, house_id: &str) -> Result<Vec<HouseMember>, DomainError> {
        let rows = sqlx::query(
            "SELECT hm.id, hm.house_id, hm.user_id, u.external_user_id, hm.joined_at, hm.removed_at \
             FROM house_members hm \
             LEFT JOIN users u ON u.id = hm.user_id \
             WHERE hm.house_id = ? AND hm.removed_at IS NULL ORDER BY hm.joined_at ASC",
        )
        .bind(house_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows
            .into_iter()
            .map(|r| HouseMember {
                id: r.get("id"),
                house_id: r.get("house_id"),
                user_id: r.get("user_id"),
                external_user_id: r.get("external_user_id"),
                joined_at: parse_dt(&r.get::<String, _>("joined_at")),
                removed_at: opt_dt(r.get("removed_at")),
            })
            .collect())
    }

    async fn add_member(&self, cmd: AddMemberCmd) -> Result<HouseMember, DomainError> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT INTO users(id, external_user_id, created_at) VALUES(?,?,?) \
             ON CONFLICT(id) DO NOTHING",
        )
        .bind(&cmd.external_user_id)
        .bind(&cmd.external_user_id)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        sqlx::query(
            "INSERT INTO house_members(id, house_id, user_id, joined_at) VALUES(?,?,?,?) \
             ON CONFLICT(house_id, user_id) DO UPDATE SET removed_at = NULL, joined_at = excluded.joined_at",
        )
        .bind(&id)
        .bind(&cmd.house_id)
        .bind(&cmd.external_user_id)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        // Re-fetch the actual row (id may differ on conflict)
        let row = sqlx::query(
            "SELECT hm.id, hm.house_id, hm.user_id, u.external_user_id, hm.joined_at, hm.removed_at \
             FROM house_members hm \
             LEFT JOIN users u ON u.id = hm.user_id \
             WHERE hm.house_id = ? AND hm.user_id = ?",
        )
        .bind(&cmd.house_id)
        .bind(&cmd.external_user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(HouseMember {
            id: row.get("id"),
            house_id: row.get("house_id"),
            user_id: row.get("user_id"),
            external_user_id: row.get("external_user_id"),
            joined_at: parse_dt(&row.get::<String, _>("joined_at")),
            removed_at: opt_dt(row.get("removed_at")),
        })
    }

    async fn remove_member(&self, id: &str) -> Result<(), DomainError> {
        let now = Utc::now().to_rfc3339();
        sqlx::query("UPDATE house_members SET removed_at = ? WHERE id = ?")
            .bind(&now)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn list_roles(&self, house_id: &str) -> Result<Vec<HouseRole>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, name, priority, is_system, house_id, created_at, updated_at \
             FROM house_roles WHERE house_id = ? ORDER BY priority DESC",
        )
        .bind(house_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows
            .into_iter()
            .map(|r| HouseRole {
                id: r.get("id"),
                name: r.get("name"),
                priority: r.get::<i64, _>("priority") as i32,
                is_system: r.get::<i64, _>("is_system") != 0,
                house_id: r.get("house_id"),
                created_at: parse_dt(&r.get::<String, _>("created_at")),
                updated_at: parse_dt(&r.get::<String, _>("updated_at")),
            })
            .collect())
    }

    async fn find_role(&self, id: &str) -> Result<Option<HouseRole>, DomainError> {
        let row = sqlx::query(
            "SELECT id, name, priority, is_system, house_id, created_at, updated_at \
             FROM house_roles WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(row.map(|r| HouseRole {
            id: r.get("id"),
            name: r.get("name"),
            priority: r.get::<i64, _>("priority") as i32,
            is_system: r.get::<i64, _>("is_system") != 0,
            house_id: r.get("house_id"),
            created_at: parse_dt(&r.get::<String, _>("created_at")),
            updated_at: parse_dt(&r.get::<String, _>("updated_at")),
        }))
    }

    async fn create_role(&self, cmd: CreateRoleCmd) -> Result<HouseRole, DomainError> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT INTO house_roles(id, name, priority, is_system, house_id, created_at, updated_at) \
             VALUES(?,?,?,0,?,?,?)",
        )
        .bind(&id)
        .bind(&cmd.name)
        .bind(cmd.priority as i64)
        .bind(&cmd.house_id)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        self.find_role(&id)
            .await?
            .ok_or_else(|| DomainError::not_found("role", &id))
    }

    async fn update_role(
        &self,
        id: &str,
        cmd: UpdateRoleCmd,
    ) -> Result<HouseRole, DomainError> {
        let role = self
            .find_role(id)
            .await?
            .ok_or_else(|| DomainError::not_found("role", id))?;

        let name = cmd.name.unwrap_or(role.name);
        let priority = cmd.priority.unwrap_or(role.priority);
        let now = Utc::now().to_rfc3339();

        sqlx::query("UPDATE house_roles SET name=?, priority=?, updated_at=? WHERE id=?")
            .bind(&name)
            .bind(priority as i64)
            .bind(&now)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

        self.find_role(id)
            .await?
            .ok_or_else(|| DomainError::not_found("role", id))
    }

    async fn delete_role(&self, id: &str) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM house_roles WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn assign_role(&self, member_id: &str, role_id: &str) -> Result<(), DomainError> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT OR IGNORE INTO house_member_roles(id, house_member_id, role_id, assigned_at) \
             VALUES(?,?,?,?)",
        )
        .bind(&id)
        .bind(member_id)
        .bind(role_id)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;
        Ok(())
    }

    async fn unassign_role(&self, member_id: &str, role_id: &str) -> Result<(), DomainError> {
        sqlx::query(
            "DELETE FROM house_member_roles WHERE house_member_id = ? AND role_id = ?",
        )
        .bind(member_id)
        .bind(role_id)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;
        Ok(())
    }

    async fn list_member_roles(&self, member_id: &str) -> Result<Vec<HouseRole>, DomainError> {
        let rows = sqlx::query(
            "SELECT r.id, r.name, r.priority, r.is_system, r.house_id, r.created_at, r.updated_at \
             FROM house_roles r \
             JOIN house_member_roles mr ON mr.role_id = r.id \
             WHERE mr.house_member_id = ? ORDER BY r.priority DESC",
        )
        .bind(member_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows
            .into_iter()
            .map(|r| HouseRole {
                id: r.get("id"),
                name: r.get("name"),
                priority: r.get::<i64, _>("priority") as i32,
                is_system: r.get::<i64, _>("is_system") != 0,
                house_id: r.get("house_id"),
                created_at: parse_dt(&r.get::<String, _>("created_at")),
                updated_at: parse_dt(&r.get::<String, _>("updated_at")),
            })
            .collect())
    }

    async fn list_rooms(&self, house_id: &str) -> Result<Vec<HouseRoom>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, name, house_id, path FROM resources \
             WHERE house_id = ? AND type = 'ROOM' ORDER BY path ASC",
        )
        .bind(house_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        let now = Utc::now();
        Ok(rows
            .into_iter()
            .map(|r| HouseRoom {
                id: r.get("id"),
                name: r.get::<Option<String>, _>("name").unwrap_or_default(),
                house_id: r.get("house_id"),
                created_at: now,
                updated_at: now,
            })
            .collect())
    }

    async fn find_room(&self, id: &str) -> Result<Option<HouseRoom>, DomainError> {
        let row = sqlx::query(
            "SELECT id, name, house_id FROM resources WHERE id = ? AND type = 'ROOM'",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        let now = Utc::now();
        Ok(row.map(|r| HouseRoom {
            id: r.get("id"),
            name: r.get::<Option<String>, _>("name").unwrap_or_default(),
            house_id: r.get("house_id"),
            created_at: now,
            updated_at: now,
        }))
    }

    async fn create_room(&self, cmd: CreateRoomCmd) -> Result<HouseRoom, DomainError> {
        let id = Uuid::new_v4().to_string();
        let path = format!("{}/{}", cmd.house_id, id);

        sqlx::query(
            "INSERT INTO resources(id, type, name, path, depth, house_id, parent_id) \
             VALUES(?, 'ROOM', ?, ?, 1, ?, ?)",
        )
        .bind(&id)
        .bind(&cmd.name)
        .bind(&path)
        .bind(&cmd.house_id)
        .bind(&cmd.parent_id)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        self.find_room(&id)
            .await?
            .ok_or_else(|| DomainError::not_found("room", &id))
    }

    async fn update_room(&self, id: &str, cmd: UpdateRoomCmd) -> Result<HouseRoom, DomainError> {
        if let Some(name) = cmd.name {
            sqlx::query("UPDATE resources SET name = ? WHERE id = ? AND type = 'ROOM'")
                .bind(&name)
                .bind(id)
                .execute(&self.pool)
                .await
                .map_err(db_err)?;
        }
        self.find_room(id)
            .await?
            .ok_or_else(|| DomainError::not_found("room", id))
    }

    async fn delete_room(&self, id: &str) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM resources WHERE id = ? AND type = 'ROOM'")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn list_invitations(
        &self,
        house_id: &str,
    ) -> Result<Vec<HouseInvitation>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, house_id, email, token_hash, status, role_id, expires_at, created_at \
             FROM house_invitations WHERE house_id = ? ORDER BY created_at DESC",
        )
        .bind(house_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows
            .into_iter()
            .map(|r| HouseInvitation {
                id: r.get("id"),
                house_id: r.get("house_id"),
                email: r.get("email"),
                token_hash: r.get("token_hash"),
                status: r.get("status"),
                role_id: r.get("role_id"),
                expires_at: parse_dt(&r.get::<String, _>("expires_at")),
                created_at: parse_dt(&r.get::<String, _>("created_at")),
            })
            .collect())
    }

    async fn create_invitation(
        &self,
        cmd: CreateInvitationCmd,
    ) -> Result<HouseInvitation, DomainError> {
        let id = Uuid::new_v4().to_string();
        let token = Uuid::new_v4().to_string();
        let now = Utc::now();
        let expires_at = now
            + chrono::Duration::hours(cmd.expires_in_hours as i64);
        let now_str = now.to_rfc3339();
        let expires_str = expires_at.to_rfc3339();

        sqlx::query(
            "INSERT INTO house_invitations(id, house_id, email, token_hash, status, role_id, expires_at, created_at) \
             VALUES(?,?,?,?,'PENDING',?,?,?)",
        )
        .bind(&id)
        .bind(&cmd.house_id)
        .bind(&cmd.email)
        .bind(&token)
        .bind(&cmd.role_id)
        .bind(&expires_str)
        .bind(&now_str)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(HouseInvitation {
            id,
            house_id: cmd.house_id,
            email: cmd.email,
            token_hash: token,
            status: "PENDING".to_string(),
            role_id: cmd.role_id,
            expires_at,
            created_at: now,
        })
    }

    async fn delete_invitation(&self, id: &str) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM house_invitations WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn find_resource(&self, id: &str) -> Result<Option<Resource>, DomainError> {
        let row = sqlx::query(
            "SELECT id, type, name, external_id, path, depth, house_id, parent_id \
             FROM resources WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(row.map(|r| Resource {
            id: r.get("id"),
            r#type: ResourceType::from_str(r.get::<String, _>("type").as_str())
                .unwrap_or(ResourceType::House),
            name: r.get("name"),
            external_id: r.get("external_id"),
            path: r.get("path"),
            depth: r.get::<i64, _>("depth") as i32,
            house_id: r.get("house_id"),
            parent_id: r.get("parent_id"),
        }))
    }

    async fn list_resources(&self, house_id: &str) -> Result<Vec<Resource>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, type, name, external_id, path, depth, house_id, parent_id \
             FROM resources WHERE house_id = ? ORDER BY path ASC",
        )
        .bind(house_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows
            .into_iter()
            .map(|r| Resource {
                id: r.get("id"),
                r#type: ResourceType::from_str(r.get::<String, _>("type").as_str())
                    .unwrap_or(ResourceType::House),
                name: r.get("name"),
                external_id: r.get("external_id"),
                path: r.get("path"),
                depth: r.get::<i64, _>("depth") as i32,
                house_id: r.get("house_id"),
                parent_id: r.get("parent_id"),
            })
            .collect())
    }

    async fn create_resource(
        &self,
        cmd: CreateResourceCmd,
    ) -> Result<Resource, DomainError> {
        let id = Uuid::new_v4().to_string();
        let depth = if cmd.parent_id.is_some() { 1 } else { 0 };
        let path = match &cmd.parent_id {
            Some(p) => format!("{}/{}", p, id),
            None => format!("{}/{}", cmd.house_id, id),
        };

        sqlx::query(
            "INSERT INTO resources(id, type, name, external_id, path, depth, house_id, parent_id) \
             VALUES(?,?,?,?,?,?,?,?)",
        )
        .bind(&id)
        .bind(cmd.resource_type.as_str())
        .bind(&cmd.name)
        .bind(&cmd.external_id)
        .bind(&path)
        .bind(depth as i64)
        .bind(&cmd.house_id)
        .bind(&cmd.parent_id)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        self.find_resource(&id)
            .await?
            .ok_or_else(|| DomainError::not_found("resource", &id))
    }

    async fn delete_resource(&self, id: &str) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM resources WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn list_rights_for_member(
        &self,
        member_id: &str,
    ) -> Result<Vec<AccessRight>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, access_right_type, parameters, resource_id, house_member_id, \
             role_id, granted_by_id, expires_at, created_at \
             FROM access_rights WHERE house_member_id = ? ORDER BY created_at DESC",
        )
        .bind(member_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows
            .into_iter()
            .map(|r| AccessRight {
                id: r.get("id"),
                access_right_type: AccessRightType::from_str(
                    r.get::<String, _>("access_right_type").as_str(),
                )
                .unwrap_or(AccessRightType::Allow),
                parameters: r.get("parameters"),
                resource_id: r.get("resource_id"),
                house_member_id: r.get("house_member_id"),
                role_id: r.get("role_id"),
                granted_by_id: r.get("granted_by_id"),
                expires_at: opt_dt(r.get("expires_at")),
                created_at: parse_dt(&r.get::<String, _>("created_at")),
            })
            .collect())
    }

    async fn create_right(
        &self,
        cmd: CreateAccessRightCmd,
    ) -> Result<AccessRight, DomainError> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT INTO access_rights \
             (id, access_right_type, resource_id, house_member_id, role_id, granted_by_id, expires_at, created_at) \
             VALUES(?,?,?,?,?,?,?,?)",
        )
        .bind(&id)
        .bind(cmd.access_right_type.as_str())
        .bind(&cmd.resource_id)
        .bind(&cmd.house_member_id)
        .bind(&cmd.role_id)
        .bind(&cmd.granted_by_external_id)
        .bind(&cmd.expires_at)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(AccessRight {
            id,
            access_right_type: cmd.access_right_type,
            parameters: None,
            resource_id: cmd.resource_id,
            house_member_id: cmd.house_member_id,
            role_id: cmd.role_id,
            granted_by_id: cmd.granted_by_external_id,
            expires_at: cmd
                .expires_at
                .as_deref()
                .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
                .map(|d| d.with_timezone(&Utc)),
            created_at: Utc::now(),
        })
    }

    async fn delete_right(&self, id: &str) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM access_rights WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn list_policies(&self, house_id: &str) -> Result<Vec<AccessPolicy>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, name, effect, subject_type, subject_id, condition, priority, \
             house_id, resource_id, created_at, updated_at \
             FROM access_policies WHERE house_id = ? ORDER BY priority DESC",
        )
        .bind(house_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows.into_iter().map(policy_from_row).collect())
    }

    async fn find_policies_for_resource(
        &self,
        resource_id: &str,
    ) -> Result<Vec<AccessPolicy>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, name, effect, subject_type, subject_id, condition, priority, \
             house_id, resource_id, created_at, updated_at \
             FROM access_policies WHERE resource_id = ? ORDER BY priority DESC",
        )
        .bind(resource_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows.into_iter().map(policy_from_row).collect())
    }

    async fn create_policy(&self, cmd: CreatePolicyCmd) -> Result<AccessPolicy, DomainError> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();
        let cond_str = cmd
            .condition
            .as_ref()
            .map(|c| serde_json::to_string(c))
            .transpose()
            .map_err(|e| DomainError::Internal(e.to_string()))?;

        sqlx::query(
            "INSERT INTO access_policies \
             (id, name, effect, subject_type, subject_id, condition, priority, house_id, resource_id, created_at, updated_at) \
             VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        )
        .bind(&id)
        .bind(&cmd.name)
        .bind(&cmd.effect)
        .bind(&cmd.subject_type)
        .bind(&cmd.subject_id)
        .bind(&cond_str)
        .bind(cmd.priority as i64)
        .bind(&cmd.house_id)
        .bind(&cmd.resource_id)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        self.find_policy(&id)
            .await?
            .ok_or_else(|| DomainError::not_found("policy", &id))
    }

    async fn update_policy(
        &self,
        id: &str,
        cmd: UpdatePolicyCmd,
    ) -> Result<AccessPolicy, DomainError> {
        let policy = self
            .find_policy(id)
            .await?
            .ok_or_else(|| DomainError::not_found("policy", id))?;

        let name = cmd.name.unwrap_or(policy.name);
        let effect = cmd.effect.unwrap_or(policy.effect);
        let priority = cmd.priority.unwrap_or(policy.priority);
        let condition = cmd.condition.or(policy.condition);
        let cond_str = condition
            .as_ref()
            .map(|c| serde_json::to_string(c))
            .transpose()
            .map_err(|e| DomainError::Internal(e.to_string()))?;
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "UPDATE access_policies SET name=?, effect=?, condition=?, priority=?, updated_at=? WHERE id=?",
        )
        .bind(&name)
        .bind(&effect)
        .bind(&cond_str)
        .bind(priority as i64)
        .bind(&now)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        self.find_policy(id)
            .await?
            .ok_or_else(|| DomainError::not_found("policy", id))
    }

    async fn delete_policy(&self, id: &str) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM access_policies WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn check_effective(
        &self,
        member_id: &str,
        resource_id: &str,
    ) -> Result<Vec<EffectivePermission>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, access_right_type, source_type, source_id, house_member_id, resource_id, expires_at \
             FROM effective_permissions \
             WHERE house_member_id = ? AND resource_id = ? \
               AND (expires_at IS NULL OR expires_at > datetime('now'))",
        )
        .bind(member_id)
        .bind(resource_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows
            .into_iter()
            .map(|r| EffectivePermission {
                id: r.get("id"),
                access_right_type: AccessRightType::from_str(
                    r.get::<String, _>("access_right_type").as_str(),
                )
                .unwrap_or(AccessRightType::Deny),
                source_type: r.get("source_type"),
                source_id: r.get("source_id"),
                house_member_id: r.get("house_member_id"),
                resource_id: r.get("resource_id"),
                expires_at: opt_dt(r.get("expires_at")),
            })
            .collect())
    }

    async fn rebuild_effective(&self, house_id: &str) -> Result<usize, DomainError> {
        let mut tx = self.pool.begin().await.map_err(db_err)?;

        sqlx::query(
            "DELETE FROM effective_permissions WHERE house_member_id IN \
             (SELECT id FROM house_members WHERE house_id = ?)",
        )
        .bind(house_id)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;

        let direct_rows = sqlx::query(
            "SELECT ar.id, ar.access_right_type, ar.house_member_id, ar.resource_id, ar.expires_at \
             FROM access_rights ar \
             JOIN house_members hm ON hm.id = ar.house_member_id \
             WHERE hm.house_id = ?",
        )
        .bind(house_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(db_err)?;

        let mut count = 0usize;
        for row in &direct_rows {
            let ep_id = Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT OR REPLACE INTO effective_permissions \
                 (id, access_right_type, source_type, source_id, house_member_id, resource_id, expires_at) \
                 VALUES(?,?,?,?,?,?,?)",
            )
            .bind(&ep_id)
            .bind(row.get::<String, _>("access_right_type"))
            .bind("DIRECT")
            .bind(row.get::<String, _>("id"))
            .bind(row.get::<String, _>("house_member_id"))
            .bind(row.get::<String, _>("resource_id"))
            .bind(row.get::<Option<String>, _>("expires_at"))
            .execute(&mut *tx)
            .await
            .map_err(db_err)?;
            count += 1;
        }

        let role_rows = sqlx::query(
            "SELECT ar.id, ar.access_right_type, mr.house_member_id, ar.resource_id, ar.expires_at \
             FROM access_rights ar \
             JOIN house_member_roles mr ON mr.role_id = ar.role_id \
             JOIN house_members hm ON hm.id = mr.house_member_id \
             WHERE hm.house_id = ? AND ar.role_id IS NOT NULL",
        )
        .bind(house_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(db_err)?;

        for row in &role_rows {
            let ep_id = Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT OR REPLACE INTO effective_permissions \
                 (id, access_right_type, source_type, source_id, house_member_id, resource_id, expires_at) \
                 VALUES(?,?,?,?,?,?,?)",
            )
            .bind(&ep_id)
            .bind(row.get::<String, _>("access_right_type"))
            .bind("ROLE")
            .bind(row.get::<String, _>("id"))
            .bind(row.get::<String, _>("house_member_id"))
            .bind(row.get::<String, _>("resource_id"))
            .bind(row.get::<Option<String>, _>("expires_at"))
            .execute(&mut *tx)
            .await
            .map_err(db_err)?;
            count += 1;
        }

        tx.commit().await.map_err(db_err)?;
        Ok(count)
    }
}

impl SqliteAccessRepo {
    async fn find_policy(&self, id: &str) -> Result<Option<AccessPolicy>, DomainError> {
        let row = sqlx::query(
            "SELECT id, name, effect, subject_type, subject_id, condition, priority, \
             house_id, resource_id, created_at, updated_at \
             FROM access_policies WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(row.map(policy_from_row))
    }
}

fn policy_from_row(r: sqlx::sqlite::SqliteRow) -> AccessPolicy {
    let condition: Option<serde_json::Value> = r
        .get::<Option<String>, _>("condition")
        .and_then(|s| serde_json::from_str(&s).ok());

    AccessPolicy {
        id: r.get("id"),
        name: r.get("name"),
        effect: r.get("effect"),
        subject_type: r.get("subject_type"),
        subject_id: r.get("subject_id"),
        condition,
        priority: r.get::<i64, _>("priority") as i32,
        house_id: r.get("house_id"),
        resource_id: r.get("resource_id"),
        created_at: parse_dt(&r.get::<String, _>("created_at")),
        updated_at: parse_dt(&r.get::<String, _>("updated_at")),
    }
}