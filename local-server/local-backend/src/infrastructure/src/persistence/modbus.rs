use async_trait::async_trait;
use chrono::Utc;
use local_server_application::ports::modbus_repository::{
    CreateModbusDeviceCmd, CreateModbusRegisterCmd, ModbusRepository, SaveModbusStateCmd,
};
use local_server_application::DomainError;
use local_server_core::entities::modbus::{
    ModbusDevice, ModbusRegister, ModbusRegisterState, RegisterType,
};
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

pub struct SqliteModbusRepo {
    pool: SqlitePool,
}

impl SqliteModbusRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

fn db_err(e: sqlx::Error) -> DomainError {
    DomainError::Internal(e.to_string())
}

fn parse_uuid(s: &str) -> Result<Uuid, DomainError> {
    Uuid::parse_str(s).map_err(|e| DomainError::Internal(format!("invalid uuid {s}: {e}")))
}

fn parse_dt(s: &str) -> Result<chrono::DateTime<Utc>, DomainError> {
    chrono::DateTime::parse_from_rfc3339(s)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| DomainError::Internal(format!("invalid datetime {s}: {e}")))
}

fn row_to_device(row: &sqlx::sqlite::SqliteRow) -> Result<ModbusDevice, DomainError> {
    Ok(ModbusDevice {
        id: parse_uuid(&row.try_get::<String, _>("id").map_err(db_err)?)?,
        name: row.try_get("name").map_err(db_err)?,
        slave_id: row.try_get("slave_id").map_err(db_err)?,
        description: row.try_get("description").map_err(db_err)?,
        enabled: row.try_get::<i64, _>("enabled").map_err(db_err)? != 0,
        created_at: parse_dt(&row.try_get::<String, _>("created_at").map_err(db_err)?)?,
        updated_at: parse_dt(&row.try_get::<String, _>("updated_at").map_err(db_err)?)?,
    })
}

fn row_to_register(row: &sqlx::sqlite::SqliteRow) -> Result<ModbusRegister, DomainError> {
    let rt_str: String = row.try_get("register_type").map_err(db_err)?;
    let register_type = RegisterType::from_str(&rt_str)
        .ok_or_else(|| DomainError::Internal(format!("unknown register_type: {rt_str}")))?;

    Ok(ModbusRegister {
        id: parse_uuid(&row.try_get::<String, _>("id").map_err(db_err)?)?,
        device_id: parse_uuid(&row.try_get::<String, _>("device_id").map_err(db_err)?)?,
        name: row.try_get("name").map_err(db_err)?,
        register_type,
        address: row.try_get("address").map_err(db_err)?,
        count: row.try_get("count").map_err(db_err)?,
        unit: row.try_get("unit").map_err(db_err)?,
        scale_factor: row.try_get("scale_factor").map_err(db_err)?,
        offset: row.try_get("offset").map_err(db_err)?,
        writable: row.try_get::<i64, _>("writable").map_err(db_err)? != 0,
        created_at: parse_dt(&row.try_get::<String, _>("created_at").map_err(db_err)?)?,
        updated_at: parse_dt(&row.try_get::<String, _>("updated_at").map_err(db_err)?)?,
    })
}

fn row_to_state(row: &sqlx::sqlite::SqliteRow) -> Result<ModbusRegisterState, DomainError> {
    let raw: Vec<serde_json::Value> = serde_json::from_str(
        &row.try_get::<String, _>("raw_values").map_err(db_err)?,
    )
    .map_err(|e| DomainError::Internal(e.to_string()))?;

    let scaled: Vec<f64> = serde_json::from_str(
        &row.try_get::<String, _>("scaled_values").map_err(db_err)?,
    )
    .map_err(|e| DomainError::Internal(e.to_string()))?;

    Ok(ModbusRegisterState {
        register_id: parse_uuid(&row.try_get::<String, _>("register_id").map_err(db_err)?)?,
        raw_values: raw,
        scaled_values: scaled,
        timestamp: parse_dt(&row.try_get::<String, _>("timestamp").map_err(db_err)?)?,
    })
}

#[async_trait]
impl ModbusRepository for SqliteModbusRepo {
    async fn list_devices(&self) -> Result<Vec<ModbusDevice>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, name, slave_id, description, enabled, created_at, updated_at \
             FROM modbus_devices ORDER BY created_at ASC",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;
        rows.iter().map(row_to_device).collect()
    }

    async fn find_device(&self, id: Uuid) -> Result<Option<ModbusDevice>, DomainError> {
        let row = sqlx::query(
            "SELECT id, name, slave_id, description, enabled, created_at, updated_at \
             FROM modbus_devices WHERE id = ?",
        )
        .bind(id.to_string())
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;
        row.as_ref().map(row_to_device).transpose()
    }

    async fn create_device(
        &self,
        cmd: CreateModbusDeviceCmd,
    ) -> Result<ModbusDevice, DomainError> {
        let id = Uuid::new_v4();
        let now = Utc::now().to_rfc3339();
        sqlx::query(
            "INSERT INTO modbus_devices (id, name, slave_id, description, enabled, created_at, updated_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id.to_string())
        .bind(&cmd.name)
        .bind(cmd.slave_id)
        .bind(&cmd.description)
        .bind(cmd.enabled as i64)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(ModbusDevice {
            id,
            name: cmd.name,
            slave_id: cmd.slave_id,
            description: cmd.description,
            enabled: cmd.enabled,
            created_at: parse_dt(&now)?,
            updated_at: parse_dt(&now)?,
        })
    }

    async fn delete_device(&self, id: Uuid) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM modbus_devices WHERE id = ?")
            .bind(id.to_string())
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn list_registers(&self, device_id: Uuid) -> Result<Vec<ModbusRegister>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, device_id, name, register_type, address, count, unit, \
             scale_factor, offset, writable, created_at, updated_at \
             FROM modbus_registers WHERE device_id = ? ORDER BY address ASC",
        )
        .bind(device_id.to_string())
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;
        rows.iter().map(row_to_register).collect()
    }

    async fn find_register(&self, id: Uuid) -> Result<Option<ModbusRegister>, DomainError> {
        let row = sqlx::query(
            "SELECT id, device_id, name, register_type, address, count, unit, \
             scale_factor, offset, writable, created_at, updated_at \
             FROM modbus_registers WHERE id = ?",
        )
        .bind(id.to_string())
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;
        row.as_ref().map(row_to_register).transpose()
    }

    async fn create_register(
        &self,
        cmd: CreateModbusRegisterCmd,
    ) -> Result<ModbusRegister, DomainError> {
        let id = Uuid::new_v4();
        let now = Utc::now().to_rfc3339();
        sqlx::query(
            "INSERT INTO modbus_registers \
             (id, device_id, name, register_type, address, count, unit, \
              scale_factor, offset, writable, created_at, updated_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id.to_string())
        .bind(cmd.device_id.to_string())
        .bind(&cmd.name)
        .bind(cmd.register_type.as_str())
        .bind(cmd.address)
        .bind(cmd.count)
        .bind(&cmd.unit)
        .bind(cmd.scale_factor)
        .bind(cmd.offset)
        .bind(cmd.writable as i64)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(ModbusRegister {
            id,
            device_id: cmd.device_id,
            name: cmd.name,
            register_type: cmd.register_type,
            address: cmd.address,
            count: cmd.count,
            unit: cmd.unit,
            scale_factor: cmd.scale_factor,
            offset: cmd.offset,
            writable: cmd.writable,
            created_at: parse_dt(&now)?,
            updated_at: parse_dt(&now)?,
        })
    }

    async fn delete_register(&self, id: Uuid) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM modbus_registers WHERE id = ?")
            .bind(id.to_string())
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn save_state(&self, cmd: SaveModbusStateCmd) -> Result<(), DomainError> {
        let raw = serde_json::to_string(&cmd.raw_values)
            .map_err(|e| DomainError::Internal(e.to_string()))?;
        let scaled = serde_json::to_string(&cmd.scaled_values)
            .map_err(|e| DomainError::Internal(e.to_string()))?;
        let now = Utc::now().to_rfc3339();
        sqlx::query(
            "INSERT INTO modbus_states (register_id, raw_values, scaled_values, timestamp) \
             VALUES (?, ?, ?, ?) \
             ON CONFLICT(register_id) DO UPDATE SET \
               raw_values = excluded.raw_values, \
               scaled_values = excluded.scaled_values, \
               timestamp = excluded.timestamp",
        )
        .bind(cmd.register_id.to_string())
        .bind(&raw)
        .bind(&scaled)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;
        Ok(())
    }

    async fn get_state(
        &self,
        register_id: Uuid,
    ) -> Result<Option<ModbusRegisterState>, DomainError> {
        let row = sqlx::query(
            "SELECT register_id, raw_values, scaled_values, timestamp \
             FROM modbus_states WHERE register_id = ?",
        )
        .bind(register_id.to_string())
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;
        row.as_ref().map(row_to_state).transpose()
    }

    async fn get_device_states(
        &self,
        device_id: Uuid,
    ) -> Result<Vec<ModbusRegisterState>, DomainError> {
        let rows = sqlx::query(
            "SELECT s.register_id, s.raw_values, s.scaled_values, s.timestamp \
             FROM modbus_states s \
             JOIN modbus_registers r ON r.id = s.register_id \
             WHERE r.device_id = ?",
        )
        .bind(device_id.to_string())
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;
        rows.iter().map(row_to_state).collect()
    }
}