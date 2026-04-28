use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

use local_server_application::ports::ZigbeeRepository;
use local_server_core::{entities::zigbee::ZigbeeDeviceState, DomainError};

pub struct SqliteZigbeeRepo {
    pool: SqlitePool,
}

impl SqliteZigbeeRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ZigbeeRepository for SqliteZigbeeRepo {
    async fn insert_state(&self, state: &ZigbeeDeviceState) -> Result<(), DomainError> {
        let mut tx = self.pool.begin().await.map_err(db_err)?;

        let state_id = Uuid::new_v4().to_string();
        let timestamp = state.timestamp.to_rfc3339();
        let payload_str =
            serde_json::to_string(&state.payload).unwrap_or_else(|_| "{}".to_owned());
        let occupancy: Option<i64> = state.occupancy.map(|b| i64::from(b));

        sqlx::query(
            "INSERT INTO zigbee_device_states
             (id, device_ieee_addr, timestamp, payload, state, brightness, linkquality,
              color_mode, occupancy, temperature, humidity, battery)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&state_id)
        .bind(&state.device_ieee_addr)
        .bind(&timestamp)
        .bind(&payload_str)
        .bind(&state.state)
        .bind(state.brightness)
        .bind(state.linkquality)
        .bind(&state.color_mode)
        .bind(occupancy)
        .bind(state.temperature)
        .bind(state.humidity)
        .bind(state.battery)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;

        // Write a log entry alongside the state
        let log_id = Uuid::new_v4().to_string();
        let metrics_json = serde_json::json!({
            "state":       state.state,
            "brightness":  state.brightness,
            "temperature": state.temperature,
            "humidity":    state.humidity,
            "battery":     state.battery,
            "occupancy":   state.occupancy,
            "linkquality": state.linkquality,
            "colorMode":   state.color_mode,
        })
        .to_string();
        let payload_keys: Vec<&str> = state
            .payload
            .as_object()
            .map(|o| o.keys().map(|k| k.as_str()).collect())
            .unwrap_or_default();
        let payload_keys_json =
            serde_json::to_string(&payload_keys).unwrap_or_else(|_| "[]".to_owned());

        sqlx::query(
            "INSERT INTO zigbee_device_logs
             (id, device_ieee_addr, timestamp, source, kind, metrics, payload_keys, state_document_id)
             VALUES (?, ?, ?, 'mqtt', 'state_update', ?, ?, ?)",
        )
        .bind(&log_id)
        .bind(&state.device_ieee_addr)
        .bind(&timestamp)
        .bind(&metrics_json)
        .bind(&payload_keys_json)
        .bind(&state_id)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;

        tx.commit().await.map_err(db_err)
    }

    async fn last_state(&self, ieee: &str) -> Result<Option<ZigbeeDeviceState>, DomainError> {
        let row = sqlx::query(
            "SELECT device_ieee_addr, timestamp, payload, state, brightness, linkquality,
                    color_mode, occupancy, temperature, humidity, battery
             FROM zigbee_device_states
             WHERE device_ieee_addr = ?
             ORDER BY timestamp DESC
             LIMIT 1",
        )
        .bind(ieee)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        row.map(|r| row_to_state(&r)).transpose()
    }

    async fn list_states(
        &self,
        ieee: &str,
        limit: i64,
    ) -> Result<Vec<ZigbeeDeviceState>, DomainError> {
        let rows = sqlx::query(
            "SELECT device_ieee_addr, timestamp, payload, state, brightness, linkquality,
                    color_mode, occupancy, temperature, humidity, battery
             FROM zigbee_device_states
             WHERE device_ieee_addr = ?
             ORDER BY timestamp DESC
             LIMIT ?",
        )
        .bind(ieee)
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        rows.iter().map(|r| row_to_state(r)).collect()
    }
}

fn row_to_state(row: &sqlx::sqlite::SqliteRow) -> Result<ZigbeeDeviceState, DomainError> {
    let ts_str: String = row.try_get("timestamp").map_err(db_err)?;
    let timestamp = DateTime::parse_from_rfc3339(&ts_str)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| DomainError::Internal(format!("invalid timestamp: {e}")))?;
    let payload_str: String = row.try_get("payload").map_err(db_err)?;
    let payload = serde_json::from_str(&payload_str).unwrap_or(serde_json::Value::Null);
    let occupancy_int: Option<i64> = row.try_get("occupancy").map_err(db_err)?;

    Ok(ZigbeeDeviceState {
        device_ieee_addr: row.try_get("device_ieee_addr").map_err(db_err)?,
        timestamp,
        payload,
        state: row.try_get("state").map_err(db_err)?,
        brightness: row.try_get("brightness").map_err(db_err)?,
        linkquality: row.try_get("linkquality").map_err(db_err)?,
        color_mode: row.try_get("color_mode").map_err(db_err)?,
        occupancy: occupancy_int.map(|i| i != 0),
        temperature: row.try_get("temperature").map_err(db_err)?,
        humidity: row.try_get("humidity").map_err(db_err)?,
        battery: row.try_get("battery").map_err(db_err)?,
    })
}

fn db_err(e: impl std::fmt::Display) -> DomainError {
    DomainError::Internal(format!("db: {e}"))
}
