use async_trait::async_trait;
use chrono::Utc;
use local_server_application::{
    services::{PendingEntry, SyncOutboxRepository},
    DomainError,
};
use serde::Serialize;
use sqlx::{Row, SqliteConnection, SqlitePool};
use uuid::Uuid;

pub struct OutboxWriter;

impl OutboxWriter {
    pub fn new() -> Self {
        Self
    }

    pub async fn write<P: Serialize>(
        &self,
        conn: &mut SqliteConnection,
        entity_type: &str,
        entity_id: &str,
        operation: &str,
        payload: &P,
    ) -> Result<(), DomainError> {
        let id = Uuid::new_v4().to_string();
        let payload_json = serde_json::to_string(payload)
            .map_err(|e| DomainError::Internal(e.to_string()))?;
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload, created_at) \
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(&id)
        .bind(entity_type)
        .bind(entity_id)
        .bind(operation)
        .bind(&payload_json)
        .bind(&now)
        .execute(conn)
        .await
        .map_err(|e| DomainError::Internal(e.to_string()))?;

        Ok(())
    }
}

impl Default for OutboxWriter {
    fn default() -> Self {
        Self::new()
    }
}

// ── SyncOutboxRepository impl ─────────────────────────────────────────────────

pub struct SqliteSyncOutboxRepo {
    pool: SqlitePool,
}

impl SqliteSyncOutboxRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl SyncOutboxRepository for SqliteSyncOutboxRepo {
    async fn find_pending(&self, limit: i64) -> Result<Vec<PendingEntry>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, entity_type, entity_id, operation, payload, created_at \
             FROM sync_outbox WHERE sent_at IS NULL ORDER BY created_at ASC LIMIT ?",
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(e.to_string()))?;

        rows.into_iter()
            .map(|r| {
                let payload_str: String = r.get("payload");
                let payload: serde_json::Value =
                    serde_json::from_str(&payload_str).unwrap_or(serde_json::Value::Null);
                let created_at_str: String = r.get("created_at");
                let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
                    .map(|d| d.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());
                Ok(PendingEntry {
                    id: r.get("id"),
                    entity_type: r.get("entity_type"),
                    entity_id: r.get("entity_id"),
                    operation: r.get("operation"),
                    payload,
                    created_at,
                })
            })
            .collect()
    }

    async fn mark_sent(&self, ids: &[String]) -> Result<(), DomainError> {
        let now = Utc::now().to_rfc3339();
        for id in ids {
            sqlx::query("UPDATE sync_outbox SET sent_at = ? WHERE id = ?")
                .bind(&now)
                .bind(id)
                .execute(&self.pool)
                .await
                .map_err(|e| DomainError::Internal(e.to_string()))?;
        }
        Ok(())
    }
}
