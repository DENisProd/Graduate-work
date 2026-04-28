use local_server_application::DomainError;
use serde::Serialize;
use sqlx::SqliteConnection;
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
        let now = chrono::Utc::now().to_rfc3339();

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
