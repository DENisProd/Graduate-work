use std::str::FromStr;

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use local_server_application::{
    DomainError,
    ports::scenario_repository::{
        CreateScenarioCmd, ScenarioExecutionRepository, ScenarioRepository, UpdateScenarioCmd,
        UpsertFromCloudCmd,
    },
};
use local_server_core::entities::scenario::{
    ExecutionStatus, Scenario, ScenarioExecution, ScenarioStatus, TriggerSource,
};
use sqlx::SqlitePool;
use uuid::Uuid;

fn db_err(e: sqlx::Error) -> DomainError {
    DomainError::Internal(e.to_string())
}

fn parse_dt(s: &str) -> Result<DateTime<Utc>, DomainError> {
    DateTime::parse_from_rfc3339(s)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| DomainError::Internal(format!("invalid datetime '{s}': {e}")))
}

pub struct SqliteScenarioRepo {
    pool: SqlitePool,
}

impl SqliteScenarioRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

fn row_to_scenario(row: &sqlx::sqlite::SqliteRow) -> Result<Scenario, DomainError> {
    use sqlx::Row;

    let id_str: String = row.try_get("id").map_err(db_err)?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|e| DomainError::Internal(format!("invalid uuid: {e}")))?;

    let status_str: String = row.try_get("status").map_err(db_err)?;
    let status = ScenarioStatus::from_str(&status_str).unwrap_or(ScenarioStatus::Offline);

    let definition_str: String = row.try_get("definition").map_err(db_err)?;
    let definition: serde_json::Value = serde_json::from_str(&definition_str)
        .map_err(|e| DomainError::Internal(format!("invalid definition JSON: {e}")))?;

    let created_at = parse_dt(&row.try_get::<String, _>("created_at").map_err(db_err)?)?;
    let updated_at = parse_dt(&row.try_get::<String, _>("updated_at").map_err(db_err)?)?;

    Ok(Scenario {
        id,
        name: row.try_get("name").map_err(db_err)?,
        description: row.try_get("description").map_err(db_err)?,
        house_id: row.try_get("house_id").map_err(db_err)?,
        creator_id: row.try_get("creator_id").map_err(db_err)?,
        definition,
        status,
        cloud_id: row.try_get("scenario_cloud_id").map_err(db_err)?,
        created_at,
        updated_at,
    })
}

const SCENARIO_COLS: &str =
    "id, name, description, house_id, creator_id, definition, status, scenario_cloud_id, created_at, updated_at";

#[async_trait]
impl ScenarioRepository for SqliteScenarioRepo {
    async fn find_online(&self) -> Result<Vec<Scenario>, DomainError> {
        let rows = sqlx::query(&format!(
            "SELECT {SCENARIO_COLS} FROM scenarios WHERE status = 'ONLINE' ORDER BY created_at DESC"
        ))
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;
        rows.iter().map(row_to_scenario).collect()
    }

    async fn find_by_id(&self, id: &Uuid) -> Result<Option<Scenario>, DomainError> {
        let id_str = id.to_string();
        let rows = sqlx::query(&format!(
            "SELECT {SCENARIO_COLS} FROM scenarios WHERE id = ?"
        ))
        .bind(&id_str)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;
        match rows.first() {
            Some(row) => row_to_scenario(row).map(Some),
            None => Ok(None),
        }
    }

    async fn list(
        &self,
        house_id: Option<&str>,
        page: i64,
        size: i64,
    ) -> Result<(Vec<Scenario>, i64), DomainError> {
        let offset = page * size;

        let total: i64 = if let Some(h) = house_id {
            sqlx::query_scalar("SELECT COUNT(*) FROM scenarios WHERE house_id = ?")
                .bind(h)
                .fetch_one(&self.pool)
                .await
                .map_err(db_err)?
        } else {
            sqlx::query_scalar("SELECT COUNT(*) FROM scenarios")
                .fetch_one(&self.pool)
                .await
                .map_err(db_err)?
        };

        let rows = if let Some(h) = house_id {
            sqlx::query(&format!(
                "SELECT {SCENARIO_COLS} FROM scenarios WHERE house_id = ? \
                 ORDER BY created_at DESC LIMIT ? OFFSET ?"
            ))
            .bind(h)
            .bind(size)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(db_err)?
        } else {
            sqlx::query(&format!(
                "SELECT {SCENARIO_COLS} FROM scenarios ORDER BY created_at DESC LIMIT ? OFFSET ?"
            ))
            .bind(size)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(db_err)?
        };

        let items = rows.iter().map(row_to_scenario).collect::<Result<Vec<_>, _>>()?;
        Ok((items, total))
    }

    async fn create(&self, cmd: CreateScenarioCmd) -> Result<Scenario, DomainError> {
        let id = Uuid::new_v4();
        let id_str = id.to_string();
        let now = chrono::Utc::now().to_rfc3339();
        let def_str = serde_json::to_string(&cmd.definition)
            .map_err(|e| DomainError::Internal(e.to_string()))?;

        sqlx::query(
            "INSERT INTO scenarios \
             (id, name, description, house_id, creator_id, definition, status, created_at, updated_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&id_str)
        .bind(&cmd.name)
        .bind(&cmd.description)
        .bind(&cmd.house_id)
        .bind(&cmd.creator_id)
        .bind(&def_str)
        .bind(cmd.status.as_str())
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        self.find_by_id(&id).await?.ok_or_else(|| DomainError::not_found("scenario", id_str))
    }

    async fn update(&self, id: &Uuid, cmd: UpdateScenarioCmd) -> Result<Scenario, DomainError> {
        let id_str = id.to_string();
        let now = chrono::Utc::now().to_rfc3339();

        let current = self
            .find_by_id(id)
            .await?
            .ok_or_else(|| DomainError::not_found("scenario", id_str.clone()))?;

        let name = cmd.name.unwrap_or(current.name);
        let description = cmd.description.or(current.description);
        let status = cmd.status.unwrap_or(current.status);
        let definition = cmd.definition.unwrap_or(current.definition);
        let def_str = serde_json::to_string(&definition)
            .map_err(|e| DomainError::Internal(e.to_string()))?;

        sqlx::query(
            "UPDATE scenarios \
             SET name = ?, description = ?, definition = ?, status = ?, updated_at = ? \
             WHERE id = ?",
        )
        .bind(&name)
        .bind(&description)
        .bind(&def_str)
        .bind(status.as_str())
        .bind(&now)
        .bind(&id_str)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        self.find_by_id(id).await?.ok_or_else(|| DomainError::not_found("scenario", id_str))
    }

    async fn delete(&self, id: &Uuid) -> Result<(), DomainError> {
        let id_str = id.to_string();
        sqlx::query("DELETE FROM scenarios WHERE id = ?")
            .bind(&id_str)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn upsert_from_cloud(
        &self,
        cloud_id: &str,
        cmd: UpsertFromCloudCmd,
    ) -> Result<Scenario, DomainError> {
        let existing_id: Option<String> =
            sqlx::query_scalar("SELECT id FROM scenarios WHERE scenario_cloud_id = ?")
                .bind(cloud_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(db_err)?;

        let def_str = serde_json::to_string(&cmd.definition)
            .map_err(|e| DomainError::Internal(e.to_string()))?;
        let cloud_ts = cmd.cloud_updated_at.to_rfc3339();

        if let Some(id_str) = existing_id {
            let id = Uuid::parse_str(&id_str)
                .map_err(|e| DomainError::Internal(format!("invalid uuid: {e}")))?;

            // Only overwrite if cloud data is newer or equal (last-write-wins).
            sqlx::query(
                "UPDATE scenarios \
                 SET name=?, description=?, definition=?, status=?, updated_at=? \
                 WHERE id=? AND updated_at <= ?",
            )
            .bind(&cmd.name)
            .bind(&cmd.description)
            .bind(&def_str)
            .bind(cmd.status.as_str())
            .bind(&cloud_ts)
            .bind(&id_str)
            .bind(&cloud_ts)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

            self.find_by_id(&id).await?.ok_or_else(|| DomainError::not_found("scenario", id_str))
        } else {
            let id = Uuid::new_v4();
            let id_str = id.to_string();

            sqlx::query(
                "INSERT INTO scenarios \
                 (id, name, description, house_id, creator_id, definition, status, \
                  scenario_cloud_id, created_at, updated_at) \
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(&id_str)
            .bind(&cmd.name)
            .bind(&cmd.description)
            .bind(&cmd.house_id)
            .bind(&cmd.creator_id)
            .bind(&def_str)
            .bind(cmd.status.as_str())
            .bind(cloud_id)
            .bind(&cloud_ts)
            .bind(&cloud_ts)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

            self.find_by_id(&id).await?.ok_or_else(|| DomainError::not_found("scenario", id_str))
        }
    }

    async fn list_without_cloud_id(&self) -> Result<Vec<Scenario>, DomainError> {
        let rows = sqlx::query(&format!(
            "SELECT {SCENARIO_COLS} FROM scenarios \
             WHERE scenario_cloud_id IS NULL ORDER BY created_at ASC"
        ))
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;
        rows.iter().map(row_to_scenario).collect()
    }

    async fn set_cloud_id(&self, id: &Uuid, cloud_id: &str) -> Result<(), DomainError> {
        sqlx::query("UPDATE scenarios SET scenario_cloud_id = ? WHERE id = ?")
            .bind(cloud_id)
            .bind(id.to_string())
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }
}

pub struct SqliteScenarioExecutionRepo {
    pool: SqlitePool,
}

impl SqliteScenarioExecutionRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

fn row_to_execution(row: &sqlx::sqlite::SqliteRow) -> Result<ScenarioExecution, DomainError> {
    use sqlx::Row;

    let id_str: String = row.try_get("id").map_err(db_err)?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|e| DomainError::Internal(format!("invalid uuid: {e}")))?;

    let scenario_id_str: String = row.try_get("scenario_id").map_err(db_err)?;
    let scenario_id = Uuid::parse_str(&scenario_id_str)
        .map_err(|e| DomainError::Internal(format!("invalid uuid: {e}")))?;

    let status_str: String = row.try_get("status").map_err(db_err)?;
    let status = ExecutionStatus::from_str(&status_str).unwrap_or(ExecutionStatus::Failure);

    let triggered_by_str: String = row.try_get("triggered_by").map_err(db_err)?;
    let triggered_by = TriggerSource::from_str(&triggered_by_str).unwrap_or(TriggerSource::Manual);

    let trigger_data: Option<serde_json::Value> = row
        .try_get::<Option<String>, _>("trigger_data")
        .map_err(db_err)?
        .and_then(|s| serde_json::from_str(&s).ok());

    let started_at = parse_dt(&row.try_get::<String, _>("started_at").map_err(db_err)?)?;

    let ended_at = row
        .try_get::<Option<String>, _>("ended_at")
        .map_err(db_err)?
        .map(|s| parse_dt(&s))
        .transpose()?;

    Ok(ScenarioExecution {
        id,
        scenario_id,
        status,
        triggered_by,
        trigger_data,
        error_message: row.try_get("error_message").map_err(db_err)?,
        started_at,
        ended_at,
    })
}

const EXEC_COLS: &str =
    "id, scenario_id, status, triggered_by, trigger_data, error_message, started_at, ended_at";

#[async_trait]
impl ScenarioExecutionRepository for SqliteScenarioExecutionRepo {
    async fn create_execution(&self, exec: &ScenarioExecution) -> Result<(), DomainError> {
        let trigger_data_str = exec
            .trigger_data
            .as_ref()
            .map(|v| serde_json::to_string(v))
            .transpose()
            .map_err(|e| DomainError::Internal(e.to_string()))?;

        sqlx::query(
            "INSERT INTO scenario_executions \
             (id, scenario_id, status, triggered_by, trigger_data, error_message, started_at, ended_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(exec.id.to_string())
        .bind(exec.scenario_id.to_string())
        .bind(exec.status.as_str())
        .bind(exec.triggered_by.as_str())
        .bind(trigger_data_str)
        .bind(&exec.error_message)
        .bind(exec.started_at.to_rfc3339())
        .bind(exec.ended_at.map(|t| t.to_rfc3339()))
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        Ok(())
    }

    async fn complete_execution(
        &self,
        id: &Uuid,
        status: ExecutionStatus,
        error: Option<String>,
        ended_at: DateTime<Utc>,
    ) -> Result<(), DomainError> {
        sqlx::query(
            "UPDATE scenario_executions \
             SET status = ?, error_message = ?, ended_at = ? WHERE id = ?",
        )
        .bind(status.as_str())
        .bind(error)
        .bind(ended_at.to_rfc3339())
        .bind(id.to_string())
        .execute(&self.pool)
        .await
        .map_err(db_err)?;
        Ok(())
    }

    async fn find_execution_by_id(
        &self,
        id: &Uuid,
    ) -> Result<Option<ScenarioExecution>, DomainError> {
        let rows = sqlx::query(&format!(
            "SELECT {EXEC_COLS} FROM scenario_executions WHERE id = ?"
        ))
        .bind(id.to_string())
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;
        match rows.first() {
            Some(row) => row_to_execution(row).map(Some),
            None => Ok(None),
        }
    }

    async fn list_executions(
        &self,
        scenario_id: &Uuid,
        limit: i64,
    ) -> Result<Vec<ScenarioExecution>, DomainError> {
        let rows = sqlx::query(&format!(
            "SELECT {EXEC_COLS} FROM scenario_executions \
             WHERE scenario_id = ? ORDER BY started_at DESC LIMIT ?"
        ))
        .bind(scenario_id.to_string())
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;
        rows.iter().map(row_to_execution).collect()
    }

    async fn list_all_executions(
        &self,
        page: i64,
        size: i64,
    ) -> Result<(Vec<ScenarioExecution>, i64), DomainError> {
        let total: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM scenario_executions")
                .fetch_one(&self.pool)
                .await
                .map_err(db_err)?;

        let rows = sqlx::query(&format!(
            "SELECT {EXEC_COLS} FROM scenario_executions \
             ORDER BY started_at DESC LIMIT ? OFFSET ?"
        ))
        .bind(size)
        .bind(page * size)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        let items = rows.iter().map(row_to_execution).collect::<Result<Vec<_>, _>>()?;
        Ok((items, total))
    }
}