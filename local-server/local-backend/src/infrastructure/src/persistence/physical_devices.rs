use std::str::FromStr;
use std::sync::Arc;

use async_trait::async_trait;
use chrono::Utc;
use local_server_application::ports::physical_device_repository::{
    CreatePhysicalDeviceCmd, PhysicalDeviceFilter, PhysicalDeviceRepository,
    UpdatePhysicalDeviceCmd, UpsertFromBridgeCmd, UpsertPhysDevFromCloudCmd,
};
use local_server_application::DomainError;
use local_server_core::entities::physical_device::{PhysicalDevice, PhysicalDeviceType};
use sqlx::{QueryBuilder, Row, SqlitePool};
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

fn row_to_entity(row: &sqlx::sqlite::SqliteRow) -> Result<PhysicalDevice, DomainError> {
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
        .map(|dt| dt.with_timezone(&Utc));

    let created_at_str: String = row.try_get("created_at").map_err(db_err)?;
    let updated_at_str: String = row.try_get("updated_at").map_err(db_err)?;

    let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| DomainError::Internal(format!("invalid created_at: {e}")))?;

    let updated_at = chrono::DateTime::parse_from_rfc3339(&updated_at_str)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| DomainError::Internal(format!("invalid updated_at: {e}")))?;

    let interview_completed: i64 = row.try_get::<Option<i64>, _>("interview_completed")
        .map_err(db_err)?
        .unwrap_or(0);

    let definition = row
        .try_get::<Option<String>, _>("definition")
        .map_err(db_err)?
        .and_then(|s| serde_json::from_str(&s).ok());

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
        power_source: row.try_get("power_source").map_err(db_err)?,
        interview_completed: interview_completed != 0,
        definition,
        last_seen,
        cloud_id: row.try_get("phys_device_cloud_id").map_err(db_err)?,
        created_at,
        updated_at,
    })
}

const SELECT_COLS: &str =
    "id, name, description, house_id, room_id, device_id, device_category_id, \
     protocol_address, network_address, type, manufacturer_name, model, \
     friendly_name, firmware_version, power_source, interview_completed, \
     definition, last_seen, created_at, updated_at, phys_device_cloud_id";

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

    async fn find_by_ieee(&self, ieee: &str) -> Result<Option<PhysicalDevice>, DomainError> {
        let rows = sqlx::query(
            &format!("SELECT {SELECT_COLS} FROM physical_devices WHERE protocol_address = ? LIMIT 1"),
        )
        .bind(ieee)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        match rows.first() {
            Some(row) => row_to_entity(row).map(Some),
            None => Ok(None),
        }
    }

    async fn list_zigbee_devices(&self) -> Result<Vec<PhysicalDevice>, DomainError> {
        let rows = sqlx::query(
            &format!(
                "SELECT {SELECT_COLS} FROM physical_devices \
                 WHERE protocol_address IS NOT NULL \
                 ORDER BY created_at DESC"
            ),
        )
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        rows.iter().map(row_to_entity).collect()
    }

    async fn create(&self, cmd: CreatePhysicalDeviceCmd) -> Result<PhysicalDevice, DomainError> {
        let id = Uuid::new_v4();
        let id_str = id.to_string();
        let now = Utc::now().to_rfc3339();

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
        let now = Utc::now().to_rfc3339();

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

    async fn delete_by_ieee(&self, ieee: &str) -> Result<(), DomainError> {
        let row = sqlx::query("SELECT id FROM physical_devices WHERE protocol_address = ? LIMIT 1")
            .bind(ieee)
            .fetch_optional(&self.pool)
            .await
            .map_err(db_err)?;

        if let Some(r) = row {
            let id_str: String = r.try_get("id").map_err(db_err)?;
            let id = Uuid::parse_str(&id_str)
                .map_err(|e| DomainError::Internal(format!("invalid uuid: {e}")))?;
            self.delete(id).await
        } else {
            Ok(())
        }
    }

    async fn upsert_by_ieee(
        &self,
        cmd: UpsertFromBridgeCmd,
    ) -> Result<PhysicalDevice, DomainError> {
        let now = Utc::now().to_rfc3339();
        let definition_json = cmd
            .definition
            .as_ref()
            .and_then(|v| serde_json::to_string(v).ok());
        let interview_completed: i64 = if cmd.interview_completed { 1 } else { 0 };

        let existing = self.find_by_ieee(&cmd.ieee_address).await?;

        if let Some(dev) = existing {
            let id_str = dev.id.to_string();
            sqlx::query(
                "UPDATE physical_devices SET \
                 friendly_name = COALESCE(?, friendly_name), \
                 type = COALESCE(?, type), \
                 network_address = COALESCE(?, network_address), \
                 manufacturer_name = COALESCE(?, manufacturer_name), \
                 model = COALESCE(?, model), \
                 firmware_version = COALESCE(?, firmware_version), \
                 power_source = COALESCE(?, power_source), \
                 interview_completed = ?, \
                 definition = COALESCE(?, definition), \
                 updated_at = ? \
                 WHERE id = ?",
            )
            .bind(&cmd.friendly_name)
            .bind(&cmd.device_type)
            .bind(cmd.network_address)
            .bind(&cmd.manufacturer_name)
            .bind(&cmd.model)
            .bind(&cmd.firmware_version)
            .bind(&cmd.power_source)
            .bind(interview_completed)
            .bind(&definition_json)
            .bind(&now)
            .bind(&id_str)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

            self.find_by_id(dev.id)
                .await?
                .ok_or_else(|| DomainError::not_found("physical_device", id_str))
        } else {
            let id = Uuid::new_v4();
            let id_str = id.to_string();

            sqlx::query(
                "INSERT INTO physical_devices \
                 (id, protocol_address, friendly_name, type, network_address, \
                  manufacturer_name, model, firmware_version, power_source, \
                  interview_completed, definition, created_at, updated_at) \
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(&id_str)
            .bind(&cmd.ieee_address)
            .bind(&cmd.friendly_name)
            .bind(&cmd.device_type)
            .bind(cmd.network_address)
            .bind(&cmd.manufacturer_name)
            .bind(&cmd.model)
            .bind(&cmd.firmware_version)
            .bind(&cmd.power_source)
            .bind(interview_completed)
            .bind(&definition_json)
            .bind(&now)
            .bind(&now)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

            self.find_by_id(id)
                .await?
                .ok_or_else(|| DomainError::not_found("physical_device", id_str))
        }
    }

    async fn update_last_seen(&self, ieee: &str) -> Result<(), DomainError> {
        let now = Utc::now().to_rfc3339();
        sqlx::query(
            "UPDATE physical_devices SET last_seen = ?, updated_at = ? \
             WHERE protocol_address = ?",
        )
        .bind(&now)
        .bind(&now)
        .bind(ieee)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;
        Ok(())
    }

    async fn upsert_from_cloud(
        &self,
        cloud_id: &str,
        protocol_address: Option<&str>,
        cmd: UpsertPhysDevFromCloudCmd,
    ) -> Result<PhysicalDevice, DomainError> {
        let cloud_ts = cmd.cloud_updated_at.to_rfc3339();
        let now = Utc::now().to_rfc3339();

        // Try to find by cloud_id first, then by protocol_address.
        let existing_id: Option<String> = sqlx::query_scalar(
            "SELECT id FROM physical_devices WHERE phys_device_cloud_id = ? LIMIT 1",
        )
        .bind(cloud_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        let existing_id = if existing_id.is_none() {
            if let Some(addr) = protocol_address {
                sqlx::query_scalar(
                    "SELECT id FROM physical_devices WHERE protocol_address = ? LIMIT 1",
                )
                .bind(addr)
                .fetch_optional(&self.pool)
                .await
                .map_err(db_err)?
            } else {
                None
            }
        } else {
            existing_id
        };

        if let Some(id_str) = existing_id {
            sqlx::query(
                "UPDATE physical_devices SET \
                 phys_device_cloud_id = ?, \
                 name = COALESCE(?, name), \
                 description = COALESCE(?, description), \
                 house_id = COALESCE(?, house_id), \
                 room_id = COALESCE(?, room_id), \
                 device_id = COALESCE((SELECT id FROM devices WHERE id = ?), device_id), \
                 device_category_id = COALESCE((SELECT id FROM device_categories WHERE id = ?), device_category_id), \
                 manufacturer_name = COALESCE(?, manufacturer_name), \
                 model = COALESCE(?, model), \
                 friendly_name = COALESCE(?, friendly_name), \
                 firmware_version = COALESCE(?, firmware_version), \
                 updated_at = ? \
                 WHERE id = ? AND updated_at <= ?",
            )
            .bind(cloud_id)
            .bind(&cmd.name)
            .bind(&cmd.description)
            .bind(&cmd.house_id)
            .bind(&cmd.room_id)
            .bind(cmd.device_id)
            .bind(cmd.device_category_id)
            .bind(&cmd.manufacturer_name)
            .bind(&cmd.model)
            .bind(&cmd.friendly_name)
            .bind(&cmd.firmware_version)
            .bind(&cloud_ts)
            .bind(&id_str)
            .bind(&cloud_ts)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

            let id = Uuid::parse_str(&id_str)
                .map_err(|e| DomainError::Internal(format!("invalid uuid: {e}")))?;
            self.find_by_id(id)
                .await?
                .ok_or_else(|| DomainError::not_found("physical_device", id_str))
        } else {
            let id = Uuid::new_v4();
            let id_str = id.to_string();
            sqlx::query(
                "INSERT INTO physical_devices \
                 (id, phys_device_cloud_id, name, description, house_id, room_id, \
                  device_id, device_category_id, protocol_address, \
                  manufacturer_name, model, friendly_name, firmware_version, \
                  created_at, updated_at) \
                 VALUES (?, ?, ?, ?, ?, ?, \
                         (SELECT id FROM devices WHERE id = ?), \
                         (SELECT id FROM device_categories WHERE id = ?), \
                         ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(&id_str)
            .bind(cloud_id)
            .bind(&cmd.name)
            .bind(&cmd.description)
            .bind(&cmd.house_id)
            .bind(&cmd.room_id)
            .bind(cmd.device_id)
            .bind(cmd.device_category_id)
            .bind(protocol_address)
            .bind(&cmd.manufacturer_name)
            .bind(&cmd.model)
            .bind(&cmd.friendly_name)
            .bind(&cmd.firmware_version)
            .bind(&now)
            .bind(&cloud_ts)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

            self.find_by_id(id)
                .await?
                .ok_or_else(|| DomainError::not_found("physical_device", id_str))
        }
    }

    async fn list_without_cloud_id(&self) -> Result<Vec<PhysicalDevice>, DomainError> {
        let rows = sqlx::query(&format!(
            "SELECT {SELECT_COLS} FROM physical_devices \
             WHERE phys_device_cloud_id IS NULL AND protocol_address IS NOT NULL \
             ORDER BY created_at ASC",
        ))
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        rows.iter().map(row_to_entity).collect()
    }

    async fn set_phys_cloud_id(&self, id: Uuid, cloud_id: &str) -> Result<(), DomainError> {
        sqlx::query(
            "UPDATE physical_devices SET phys_device_cloud_id = ? WHERE id = ?",
        )
        .bind(cloud_id)
        .bind(id.to_string())
        .execute(&self.pool)
        .await
        .map_err(db_err)?;
        Ok(())
    }
}
