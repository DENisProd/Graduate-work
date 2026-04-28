use std::str::FromStr;
use std::sync::Arc;

use async_trait::async_trait;
use local_server_application::ports::physical_device_repository::{
    CreatePhysicalDeviceCmd, PhysicalDeviceFilter, PhysicalDeviceRepository, UpdatePhysicalDeviceCmd,
};
use local_server_application::DomainError;
use local_server_core::entities::physical_device::{PhysicalDevice, PhysicalDeviceType};
use sqlx::{QueryBuilder, SqlitePool};
use uuid::Uuid;

use super::sync_outbox::OutboxWriter;

pub struct SqlitePhysicalDeviceRepo {
    pool: SqlitePool,
    outbox: Arc<OutboxWriter>,
}

impl SqlitePhysicalDeviceRepo {
    pub fn new(pool: SqlitePool, outbox: Arc<OutboxWriter>) -> Self {
        Self { pool, outbox }
    }
}

fn db_err(e: sqlx::Error) -> DomainError {
    DomainError::Internal(e.to_string())
}

/// Mapping from raw sqlx `Row` to domain entity.
fn row_to_entity(row: &sqlx::sqlite::SqliteRow) -> Result<PhysicalDevice, DomainError> {
    use sqlx::Row;

    let id_str: String = row.try_get("id").map_err(db_err)?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|e| DomainError::Internal(format!("invalid uuid {id_str}: {e}")))?;

    let device_type = row
        .try_get::<Option<String>, _>("type")
        .map_err(db_err)?
        .as_deref()
        .and_then(|s| PhysicalDeviceType::from_str(s).ok());

    let last_seen = row
        .try_get::<Option<String>, _>("last_seen")
        .map_err(db_err)?
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
        .map(|dt| dt.with_timezone(&chrono::Utc));

    let created_at_str: String = row.try_get("created_at").map_err(db_err)?;
    let updated_at_str: String = row.try_get("updated_at").map_err(db_err)?;

    let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
        .map(|dt| dt.with_timezone(&chrono::Utc))
        .map_err(|e| DomainError::Internal(format!("invalid created_at: {e}")))?;

    let updated_at = chrono::DateTime::parse_from_rfc3339(&updated_at_str)
        .map(|dt| dt.with_timezone(&chrono::Utc))
        .map_err(|e| DomainError::Internal(format!("invalid updated_at: {e}")))?;

    Ok(PhysicalDevice {
        id,
        name: row.try_get("name").map_err(db_err)?,
        description: row.try_get("description").map_err(db_err)?,
        house_id: row.try_get("house_id").map_err(db_err)?,
        room_id: row.try_get("room_id").map_err(db_err)?,
        device_id: row.try_get("device_id").map_err(db_err)?,
        device_category_id: row.try_get("device_category_id").map_err(db_err)?,
        protocol_address: row.try_get("protocol_address").map_err(db_err)?,
        network_address: row.try_get("network_address").map_err(db_err)?,
        r#type: device_type,
        manufacturer_name: row.try_get("manufacturer_name").map_err(db_err)?,
        model: row.try_get("model").map_err(db_err)?,
        friendly_name: row.try_get("friendly_name").map_err(db_err)?,
        firmware_version: row.try_get("firmware_version").map_err(db_err)?,
        last_seen,
        created_at,
        updated_at,
    })
}

const SELECT_COLS: &str =
    "id, name, description, house_id, room_id, device_id, device_category_id, \
     protocol_address, network_address, type, manufacturer_name, model, \
     friendly_name, firmware_version, last_seen, created_at, updated_at";

#[async_trait]
impl PhysicalDeviceRepository for SqlitePhysicalDeviceRepo {
    async fn find_all(
        &self,
        filter: PhysicalDeviceFilter,
    ) -> Result<Vec<PhysicalDevice>, DomainError> {
        let mut qb: QueryBuilder<sqlx::Sqlite> = QueryBuilder::new(
            format!("SELECT {SELECT_COLS} FROM physical_devices WHERE 1=1"),
        );

        if let Some(h) = &filter.house_id {
            qb.push(" AND house_id = ").push_bind(h);
        }
        if let Some(r) = &filter.room_id {
            qb.push(" AND room_id = ").push_bind(r);
        }
        qb.push(" ORDER BY created_at DESC");

        let rows = qb.build().fetch_all(&self.pool).await.map_err(db_err)?;

        rows.iter().map(row_to_entity).collect()
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<PhysicalDevice>, DomainError> {
        let id_str = id.to_string();
        let rows = sqlx::query(
            &format!("SELECT {SELECT_COLS} FROM physical_devices WHERE id = ?"),
        )
        .bind(&id_str)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        match rows.first() {
            Some(row) => row_to_entity(row).map(Some),
            None => Ok(None),
        }
    }

    async fn create(&self, cmd: CreatePhysicalDeviceCmd) -> Result<PhysicalDevice, DomainError> {
        let id = Uuid::new_v4();
        let id_str = id.to_string();
        let now = chrono::Utc::now().to_rfc3339();

        let mut tx = self.pool.begin().await.map_err(db_err)?;

        sqlx::query(
            "INSERT INTO physical_devices \
             (id, name, description, house_id, room_id, device_id, device_category_id, \
              protocol_address, type, manufacturer_name, model, friendly_name, \
              firmware_version, created_at, updated_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&id_str)
        .bind(&cmd.name)
        .bind(&cmd.description)
        .bind(&cmd.house_id)
        .bind(&cmd.room_id)
        .bind(cmd.device_id)
        .bind(cmd.device_category_id)
        .bind(&cmd.protocol_address)
        .bind(&cmd.r#type)
        .bind(&cmd.manufacturer_name)
        .bind(&cmd.model)
        .bind(&cmd.friendly_name)
        .bind(&cmd.firmware_version)
        .bind(&now)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;

        self.outbox
            .write(
                &mut *tx,
                "physical_device",
                &id_str,
                "INSERT",
                &serde_json::json!({ "id": id_str }),
            )
            .await?;

        tx.commit().await.map_err(db_err)?;

        self.find_by_id(id)
            .await?
            .ok_or_else(|| DomainError::not_found("physical_device", id_str))
    }

    async fn update(
        &self,
        id: Uuid,
        cmd: UpdatePhysicalDeviceCmd,
    ) -> Result<PhysicalDevice, DomainError> {
        let id_str = id.to_string();
        let now = chrono::Utc::now().to_rfc3339();

        let mut tx = self.pool.begin().await.map_err(db_err)?;

        sqlx::query(
            "UPDATE physical_devices SET name = ?, description = ?, room_id = ?, \
             device_id = ?, device_category_id = ?, friendly_name = ?, updated_at = ? \
             WHERE id = ?",
        )
        .bind(&cmd.name)
        .bind(&cmd.description)
        .bind(&cmd.room_id)
        .bind(cmd.device_id)
        .bind(cmd.device_category_id)
        .bind(&cmd.friendly_name)
        .bind(&now)
        .bind(&id_str)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;

        self.outbox
            .write(
                &mut *tx,
                "physical_device",
                &id_str,
                "UPDATE",
                &serde_json::json!({ "id": id_str }),
            )
            .await?;

        tx.commit().await.map_err(db_err)?;

        self.find_by_id(id)
            .await?
            .ok_or_else(|| DomainError::not_found("physical_device", id_str))
    }

    async fn delete(&self, id: Uuid) -> Result<(), DomainError> {
        let id_str = id.to_string();
        let mut tx = self.pool.begin().await.map_err(db_err)?;

        sqlx::query("DELETE FROM physical_devices WHERE id = ?")
            .bind(&id_str)
            .execute(&mut *tx)
            .await
            .map_err(db_err)?;

        self.outbox
            .write(
                &mut *tx,
                "physical_device",
                &id_str,
                "DELETE",
                &serde_json::json!({ "id": id_str }),
            )
            .await?;

        tx.commit().await.map_err(db_err)
    }
}
