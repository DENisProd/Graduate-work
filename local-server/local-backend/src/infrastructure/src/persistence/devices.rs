use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;

use async_trait::async_trait;
use local_server_application::ports::device_repository::{
    CreateDeviceCmd, DeviceRepository, PageResult, UpdateDeviceCmd,
};
use local_server_application::DomainError;
use local_server_core::entities::device::*;
use sqlx::SqlitePool;

use super::sync_outbox::OutboxWriter;

pub struct SqliteDeviceRepo {
    pool: SqlitePool,
    outbox: Arc<OutboxWriter>,
}

impl SqliteDeviceRepo {
    pub fn new(pool: SqlitePool, outbox: Arc<OutboxWriter>) -> Self {
        Self { pool, outbox }
    }
}

fn db_err(e: sqlx::Error) -> DomainError {
    DomainError::Internal(e.to_string())
}

fn parse_status(s: &str) -> DeviceStatus {
    DeviceStatus::from_str(s).unwrap_or_default()
}

fn parse_fn_type(s: &str) -> FunctionType {
    FunctionType::from_str(s).unwrap_or(FunctionType::Read)
}

fn parse_action_type(s: &str) -> ActionType {
    ActionType::from_str(s).unwrap_or(ActionType::Command)
}

#[derive(sqlx::FromRow)]
struct DeviceRow {
    id: i64,
    code: String,
    device_category_id: i64,
    status: String,
    serial_number: Option<String>,
    firmware_version: Option<String>,
    active: bool,
    is_moderated: bool,
    last_seen_at: Option<String>,
}

impl DeviceRow {
    fn into_entity(self) -> Device {
        Device {
            id: self.id,
            code: self.code,
            device_category_id: self.device_category_id,
            status: parse_status(&self.status),
            serial_number: self.serial_number,
            firmware_version: self.firmware_version,
            active: self.active,
            is_moderated: self.is_moderated,
            last_seen_at: self.last_seen_at,
        }
    }
}

#[derive(sqlx::FromRow)]
struct FunctionRow {
    id: i64,
    code: String,
    device_id: i64,
    function_type: String,
    current_value: Option<String>,
    min_value: Option<String>,
    max_value: Option<String>,
    unit: Option<String>,
    active: bool,
}

impl FunctionRow {
    fn into_entity(self) -> DeviceFunction {
        DeviceFunction {
            id: self.id,
            code: self.code,
            device_id: self.device_id,
            function_type: parse_fn_type(&self.function_type),
            current_value: self.current_value,
            min_value: self.min_value,
            max_value: self.max_value,
            unit: self.unit,
            active: self.active,
        }
    }

    fn into_detailed(self, actions: Vec<DeviceFunctionAction>) -> DeviceFunctionDetailed {
        DeviceFunctionDetailed {
            id: self.id,
            code: self.code,
            device_id: self.device_id,
            function_type: parse_fn_type(&self.function_type),
            current_value: self.current_value,
            min_value: self.min_value,
            max_value: self.max_value,
            unit: self.unit,
            active: self.active,
            actions,
        }
    }
}

#[derive(sqlx::FromRow)]
struct ActionRow {
    id: i64,
    code: String,
    device_function_id: i64,
    action_type: String,
    payload_template: Option<String>,
    active: bool,
}

impl ActionRow {
    fn into_entity(self) -> DeviceFunctionAction {
        DeviceFunctionAction {
            id: self.id,
            code: self.code,
            device_function_id: self.device_function_id,
            action_type: parse_action_type(&self.action_type),
            payload_template: self.payload_template,
            active: self.active,
        }
    }
}

#[async_trait]
impl DeviceRepository for SqliteDeviceRepo {
    async fn find_all(&self, page: i64, size: i64) -> Result<PageResult<Device>, DomainError> {
        let offset = page * size;
        let rows = sqlx::query_as::<_, DeviceRow>(
            "SELECT id, code, device_category_id, status, serial_number, firmware_version, \
             active, is_moderated, last_seen_at \
             FROM devices WHERE active = 1 ORDER BY id LIMIT ? OFFSET ?",
        )
        .bind(size)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        let total: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM devices WHERE active = 1")
                .fetch_one(&self.pool)
                .await
                .map_err(db_err)?;

        Ok(PageResult {
            content: rows.into_iter().map(DeviceRow::into_entity).collect(),
            total_elements: total,
            page,
            size,
        })
    }

    async fn find_by_id(&self, id: i64) -> Result<Option<Device>, DomainError> {
        let row = sqlx::query_as::<_, DeviceRow>(
            "SELECT id, code, device_category_id, status, serial_number, firmware_version, \
             active, is_moderated, last_seen_at FROM devices WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(row.map(DeviceRow::into_entity))
    }

    async fn find_detailed(&self, id: i64) -> Result<Option<DeviceDetailed>, DomainError> {
        let device = match self.find_by_id(id).await? {
            Some(d) => d,
            None => return Ok(None),
        };

        let fn_rows = sqlx::query_as::<_, FunctionRow>(
            "SELECT id, code, device_id, function_type, current_value, min_value, max_value, \
             unit, active FROM device_functions WHERE device_id = ? AND active = 1",
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        let fn_ids: Vec<i64> = fn_rows.iter().map(|r| r.id).collect();

        let mut actions_by_fn: HashMap<i64, Vec<DeviceFunctionAction>> = HashMap::new();
        for fn_id in &fn_ids {
            let action_rows = sqlx::query_as::<_, ActionRow>(
                "SELECT id, code, device_function_id, action_type, payload_template, active \
                 FROM device_function_actions WHERE device_function_id = ? AND active = 1",
            )
            .bind(fn_id)
            .fetch_all(&self.pool)
            .await
            .map_err(db_err)?;

            actions_by_fn.insert(*fn_id, action_rows.into_iter().map(ActionRow::into_entity).collect());
        }

        let trans_rows = sqlx::query_as::<_, (String, Option<String>, Option<String>)>(
            "SELECT locale, name, description FROM device_translations WHERE device_id = ?",
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        let translations = trans_rows
            .into_iter()
            .map(|(locale, name, description)| DeviceTranslation { locale, name, description })
            .collect();

        let functions = fn_rows
            .into_iter()
            .map(|r| {
                let actions = actions_by_fn.remove(&r.id).unwrap_or_default();
                r.into_detailed(actions)
            })
            .collect();

        Ok(Some(DeviceDetailed {
            id: device.id,
            code: device.code,
            device_category_id: device.device_category_id,
            status: device.status,
            serial_number: device.serial_number,
            firmware_version: device.firmware_version,
            active: device.active,
            is_moderated: device.is_moderated,
            last_seen_at: device.last_seen_at,
            functions,
            translations,
        }))
    }

    async fn find_by_code(&self, code: &str) -> Result<Option<Device>, DomainError> {
        let row = sqlx::query_as::<_, DeviceRow>(
            "SELECT id, code, device_category_id, status, serial_number, firmware_version, \
             active, is_moderated, last_seen_at FROM devices WHERE code = ?",
        )
        .bind(code)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(row.map(DeviceRow::into_entity))
    }

    async fn create(&self, cmd: CreateDeviceCmd) -> Result<Device, DomainError> {
        let status = cmd.status.as_str();
        let active = cmd.active as i64;
        let is_moderated = cmd.is_moderated as i64;

        let mut tx = self.pool.begin().await.map_err(db_err)?;

        let id: i64 = sqlx::query_scalar(
            "INSERT INTO devices (code, device_category_id, status, serial_number, \
             firmware_version, active, is_moderated) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
        )
        .bind(&cmd.code)
        .bind(cmd.device_category_id)
        .bind(status)
        .bind(&cmd.serial_number)
        .bind(&cmd.firmware_version)
        .bind(active)
        .bind(is_moderated)
        .fetch_one(&mut *tx)
        .await
        .map_err(db_err)?;

        let device = Device {
            id,
            code: cmd.code,
            device_category_id: cmd.device_category_id,
            status: cmd.status,
            serial_number: cmd.serial_number,
            firmware_version: cmd.firmware_version,
            active: cmd.active,
            is_moderated: cmd.is_moderated,
            last_seen_at: None,
        };

        self.outbox
            .write(&mut *tx, "device", &id.to_string(), "INSERT", &device)
            .await?;

        tx.commit().await.map_err(db_err)?;
        Ok(device)
    }

    async fn update(&self, id: i64, cmd: UpdateDeviceCmd) -> Result<Device, DomainError> {
        let status = cmd.status.as_str();
        let active = cmd.active as i64;

        let mut tx = self.pool.begin().await.map_err(db_err)?;

        sqlx::query(
            "UPDATE devices SET code = ?, device_category_id = ?, status = ?, \
             serial_number = ?, firmware_version = ?, active = ? WHERE id = ?",
        )
        .bind(&cmd.code)
        .bind(cmd.device_category_id)
        .bind(status)
        .bind(&cmd.serial_number)
        .bind(&cmd.firmware_version)
        .bind(active)
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;

        self.outbox
            .write(
                &mut *tx,
                "device",
                &id.to_string(),
                "UPDATE",
                &serde_json::json!({ "id": id, "code": cmd.code }),
            )
            .await?;

        tx.commit().await.map_err(db_err)?;

        self.find_by_id(id)
            .await?
            .ok_or_else(|| DomainError::not_found("device", id.to_string()))
    }

    async fn soft_delete(&self, id: i64) -> Result<(), DomainError> {
        let mut tx = self.pool.begin().await.map_err(db_err)?;

        sqlx::query("UPDATE devices SET active = 0 WHERE id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(db_err)?;

        self.outbox
            .write(
                &mut *tx,
                "device",
                &id.to_string(),
                "DELETE",
                &serde_json::json!({ "id": id }),
            )
            .await?;

        tx.commit().await.map_err(db_err)
    }

    async fn update_status(&self, id: i64, status: DeviceStatus) -> Result<Device, DomainError> {
        let status_str = status.as_str();
        let now = chrono::Utc::now().to_rfc3339();

        let mut tx = self.pool.begin().await.map_err(db_err)?;

        sqlx::query(
            "UPDATE devices SET status = ?, \
             last_seen_at = CASE WHEN ? = 'ONLINE' THEN ? ELSE last_seen_at END \
             WHERE id = ?",
        )
        .bind(status_str)
        .bind(status_str)
        .bind(&now)
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;

        self.outbox
            .write(
                &mut *tx,
                "device",
                &id.to_string(),
                "UPDATE",
                &serde_json::json!({ "id": id, "status": status_str }),
            )
            .await?;

        tx.commit().await.map_err(db_err)?;

        self.find_by_id(id)
            .await?
            .ok_or_else(|| DomainError::not_found("device", id.to_string()))
    }

    async fn find_functions_by_device(
        &self,
        device_id: i64,
    ) -> Result<Vec<DeviceFunction>, DomainError> {
        let rows = sqlx::query_as::<_, FunctionRow>(
            "SELECT id, code, device_id, function_type, current_value, min_value, max_value, \
             unit, active FROM device_functions WHERE device_id = ? AND active = 1",
        )
        .bind(device_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows.into_iter().map(FunctionRow::into_entity).collect())
    }

    async fn update_function_value(
        &self,
        fn_id: i64,
        value: &str,
    ) -> Result<DeviceFunction, DomainError> {
        let mut tx = self.pool.begin().await.map_err(db_err)?;

        sqlx::query("UPDATE device_functions SET current_value = ? WHERE id = ?")
            .bind(value)
            .bind(fn_id)
            .execute(&mut *tx)
            .await
            .map_err(db_err)?;

        let row = sqlx::query_as::<_, FunctionRow>(
            "SELECT id, code, device_id, function_type, current_value, min_value, max_value, \
             unit, active FROM device_functions WHERE id = ?",
        )
        .bind(fn_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db_err)?
        .ok_or_else(|| DomainError::not_found("device_function", fn_id.to_string()))?;

        let func = row.into_entity();

        self.outbox
            .write(
                &mut *tx,
                "device_function",
                &fn_id.to_string(),
                "UPDATE",
                &serde_json::json!({ "id": fn_id, "currentValue": value }),
            )
            .await?;

        tx.commit().await.map_err(db_err)?;
        Ok(func)
    }

    async fn find_all_categories(&self) -> Result<Vec<DeviceCategory>, DomainError> {
        #[derive(sqlx::FromRow)]
        struct CategoryRow {
            id: i64,
            code: String,
            device_type_id: i64,
            active: bool,
            is_moderated: bool,
        }

        let rows = sqlx::query_as::<_, CategoryRow>(
            "SELECT id, code, device_type_id, active, is_moderated \
             FROM device_categories WHERE active = 1 ORDER BY id",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows
            .into_iter()
            .map(|r| DeviceCategory {
                id: r.id,
                code: r.code,
                device_type_id: r.device_type_id,
                active: r.active,
                is_moderated: r.is_moderated,
            })
            .collect())
    }

    async fn find_all_types(&self) -> Result<Vec<DeviceType>, DomainError> {
        #[derive(sqlx::FromRow)]
        struct TypeRow {
            id: i64,
            code: String,
            active: bool,
        }

        let rows = sqlx::query_as::<_, TypeRow>(
            "SELECT id, code, active FROM device_types WHERE active = 1 ORDER BY id",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(rows
            .into_iter()
            .map(|r| DeviceType { id: r.id, code: r.code, active: r.active })
            .collect())
    }
}