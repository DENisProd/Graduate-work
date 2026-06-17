use async_trait::async_trait;
use chrono::Utc;
use local_server_application::ports::widget_dashboard_repository::{
    CreateWidgetDashboardCmd, UpdateWidgetDashboardCmd, UpsertFromCloudWidgetDashboardCmd,
    WidgetDashboardRepository,
};
use local_server_application::DomainError;
use local_server_core::entities::widget_dashboard::WidgetDashboard;
use serde_json::Value;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

pub struct SqliteWidgetDashboardRepo {
    pool: SqlitePool,
}

impl SqliteWidgetDashboardRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

fn db_err(e: sqlx::Error) -> DomainError {
    DomainError::Internal(e.to_string())
}

fn row_to_entity(row: &sqlx::sqlite::SqliteRow) -> Result<WidgetDashboard, DomainError> {
    let id_str: String = row.try_get("id").map_err(db_err)?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|e| DomainError::Internal(format!("invalid uuid {id_str}: {e}")))?;

    let layouts: Value = row
        .try_get::<String, _>("layouts")
        .map_err(db_err)
        .and_then(|s| serde_json::from_str(&s).map_err(|e| DomainError::Internal(e.to_string())))?;

    let widgets: Vec<Value> = row
        .try_get::<String, _>("widgets")
        .map_err(db_err)
        .and_then(|s| serde_json::from_str(&s).map_err(|e| DomainError::Internal(e.to_string())))?;

    let created_at_str: String = row.try_get("created_at").map_err(db_err)?;
    let updated_at_str: String = row.try_get("updated_at").map_err(db_err)?;

    let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| DomainError::Internal(format!("invalid created_at: {e}")))?;

    let updated_at = chrono::DateTime::parse_from_rfc3339(&updated_at_str)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| DomainError::Internal(format!("invalid updated_at: {e}")))?;

    let is_default: i64 = row
        .try_get::<Option<i64>, _>("is_default")
        .map_err(db_err)?
        .unwrap_or(0);

    let last_pushed_at = row
        .try_get::<Option<String>, _>("last_pushed_at")
        .map_err(db_err)?
        .and_then(|s| {
            chrono::DateTime::parse_from_rfc3339(&s)
                .ok()
                .map(|dt| dt.with_timezone(&Utc))
        });

    Ok(WidgetDashboard {
        id,
        house_id: row.try_get("house_id").map_err(db_err)?,
        user_id: row.try_get("user_id").map_err(db_err)?,
        name: row.try_get("name").map_err(db_err)?,
        is_default: is_default != 0,
        layouts,
        widgets,
        cloud_id: row.try_get("cloud_id").map_err(db_err)?,
        created_at,
        updated_at,
        last_pushed_at,
    })
}

const SELECT_COLS: &str =
    "id, house_id, user_id, name, is_default, layouts, widgets, cloud_id, \
     created_at, updated_at, last_pushed_at";

#[async_trait]
impl WidgetDashboardRepository for SqliteWidgetDashboardRepo {
    async fn find_by_house(&self, house_id: &str) -> Result<Vec<WidgetDashboard>, DomainError> {
        let rows = sqlx::query(&format!(
            "SELECT {SELECT_COLS} FROM widget_dashboards \
             WHERE house_id = ? ORDER BY created_at DESC",
        ))
        .bind(house_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        rows.iter().map(row_to_entity).collect()
    }

    async fn find_by_id(&self, id: &Uuid) -> Result<Option<WidgetDashboard>, DomainError> {
        let rows = sqlx::query(&format!(
            "SELECT {SELECT_COLS} FROM widget_dashboards WHERE id = ?",
        ))
        .bind(id.to_string())
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        match rows.first() {
            Some(row) => row_to_entity(row).map(Some),
            None => Ok(None),
        }
    }

    async fn create(&self, cmd: CreateWidgetDashboardCmd) -> Result<WidgetDashboard, DomainError> {
        let id = Uuid::new_v4();
        let id_str = id.to_string();
        let now = Utc::now().to_rfc3339();
        let layouts_json = serde_json::to_string(&cmd.layouts)
            .map_err(|e| DomainError::Internal(e.to_string()))?;
        let widgets_json = serde_json::to_string(&cmd.widgets)
            .map_err(|e| DomainError::Internal(e.to_string()))?;
        let is_default: i64 = if cmd.is_default { 1 } else { 0 };

        sqlx::query(
            "INSERT INTO widget_dashboards \
             (id, house_id, user_id, name, is_default, layouts, widgets, created_at, updated_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&id_str)
        .bind(&cmd.house_id)
        .bind(&cmd.user_id)
        .bind(&cmd.name)
        .bind(is_default)
        .bind(&layouts_json)
        .bind(&widgets_json)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        self.find_by_id(&id)
            .await?
            .ok_or_else(|| DomainError::not_found("widget_dashboard", id_str))
    }

    async fn update(
        &self,
        id: &Uuid,
        cmd: UpdateWidgetDashboardCmd,
    ) -> Result<WidgetDashboard, DomainError> {
        let id_str = id.to_string();
        let now = Utc::now().to_rfc3339();
        let layouts_json = cmd
            .layouts
            .as_ref()
            .and_then(|v| serde_json::to_string(v).ok());
        let widgets_json = cmd
            .widgets
            .as_ref()
            .and_then(|v| serde_json::to_string(v).ok());
        let is_default = cmd.is_default.map(|b| if b { 1i64 } else { 0i64 });

        sqlx::query(
            "UPDATE widget_dashboards SET \
             name = COALESCE(?, name), \
             is_default = COALESCE(?, is_default), \
             layouts = COALESCE(?, layouts), \
             widgets = COALESCE(?, widgets), \
             updated_at = ? \
             WHERE id = ?",
        )
        .bind(&cmd.name)
        .bind(is_default)
        .bind(&layouts_json)
        .bind(&widgets_json)
        .bind(&now)
        .bind(&id_str)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;

        self.find_by_id(id)
            .await?
            .ok_or_else(|| DomainError::not_found("widget_dashboard", id_str))
    }

    async fn delete(&self, id: &Uuid) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM widget_dashboards WHERE id = ?")
            .bind(id.to_string())
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn clear_default(&self, house_id: &str, user_id: &str) -> Result<(), DomainError> {
        sqlx::query(
            "UPDATE widget_dashboards SET is_default = 0 \
             WHERE house_id = ? AND user_id = ? AND is_default = 1",
        )
        .bind(house_id)
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(db_err)?;
        Ok(())
    }

    async fn upsert_from_cloud(
        &self,
        cloud_id: &str,
        cmd: UpsertFromCloudWidgetDashboardCmd,
    ) -> Result<WidgetDashboard, DomainError> {
        let cloud_ts = cmd.cloud_updated_at.to_rfc3339();
        let now = Utc::now().to_rfc3339();
        let layouts_json = serde_json::to_string(&cmd.layouts)
            .map_err(|e| DomainError::Internal(e.to_string()))?;
        let widgets_json = serde_json::to_string(&cmd.widgets)
            .map_err(|e| DomainError::Internal(e.to_string()))?;
        let is_default: i64 = if cmd.is_default { 1 } else { 0 };

        let existing_id: Option<String> = sqlx::query_scalar(
            "SELECT id FROM widget_dashboards WHERE cloud_id = ? LIMIT 1",
        )
        .bind(cloud_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_err)?;

        if let Some(id_str) = existing_id {
            let id = Uuid::parse_str(&id_str)
                .map_err(|e| DomainError::Internal(format!("invalid uuid: {e}")))?;
            if let Some(existing) = self.find_by_id(&id).await? {
                let has_unpushed = existing
                    .last_pushed_at
                    .map(|pushed| existing.updated_at > pushed)
                    .unwrap_or(true);
                if has_unpushed && cmd.cloud_updated_at <= existing.updated_at {
                    tracing::debug!(
                        cloud_id,
                        local_updated_at = %existing.updated_at.to_rfc3339(),
                        cloud_updated_at = %cmd.cloud_updated_at.to_rfc3339(),
                        "widget_dashboard: skip cloud pull — local has unpushed edits"
                    );
                    return Ok(existing);
                }
                if cmd.cloud_updated_at <= existing.updated_at {
                    tracing::debug!(
                        cloud_id,
                        local_updated_at = %existing.updated_at.to_rfc3339(),
                        cloud_updated_at = %cmd.cloud_updated_at.to_rfc3339(),
                        "widget_dashboard: skip cloud pull — local is newer"
                    );
                    return Ok(existing);
                }
            }

            sqlx::query(
                "UPDATE widget_dashboards SET \
                 house_id = ?, user_id = ?, name = ?, is_default = ?, \
                 layouts = ?, widgets = ?, updated_at = ?, last_pushed_at = ? \
                 WHERE id = ?",
            )
            .bind(&cmd.house_id)
            .bind(&cmd.user_id)
            .bind(&cmd.name)
            .bind(is_default)
            .bind(&layouts_json)
            .bind(&widgets_json)
            .bind(&cloud_ts)
            .bind(&cloud_ts)
            .bind(&id_str)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

            self.find_by_id(&id)
                .await?
                .ok_or_else(|| DomainError::not_found("widget_dashboard", id_str))
        } else {
            let orphan_id: Option<String> = sqlx::query_scalar(
                "SELECT id FROM widget_dashboards \
                 WHERE house_id = ? AND cloud_id IS NULL \
                 ORDER BY is_default DESC, updated_at DESC LIMIT 1",
            )
            .bind(&cmd.house_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(db_err)?;

            if let Some(id_str) = orphan_id {
                tracing::info!(
                    cloud_id,
                    local_id = %id_str,
                    house_id = %cmd.house_id,
                    "widget_dashboard: linking orphan local dashboard to cloud record"
                );

                sqlx::query(
                    "UPDATE widget_dashboards SET \
                     cloud_id = ?, house_id = ?, user_id = ?, name = ?, is_default = ?, \
                     layouts = ?, widgets = ?, updated_at = ?, last_pushed_at = ? \
                     WHERE id = ?",
                )
                .bind(cloud_id)
                .bind(&cmd.house_id)
                .bind(&cmd.user_id)
                .bind(&cmd.name)
                .bind(is_default)
                .bind(&layouts_json)
                .bind(&widgets_json)
                .bind(&cloud_ts)
                .bind(&cloud_ts)
                .bind(&id_str)
                .execute(&self.pool)
                .await
                .map_err(db_err)?;

                let id = Uuid::parse_str(&id_str)
                    .map_err(|e| DomainError::Internal(format!("invalid uuid: {e}")))?;
                return self
                    .find_by_id(&id)
                    .await?
                    .ok_or_else(|| DomainError::not_found("widget_dashboard", id_str));
            }

            let id = Uuid::new_v4();
            let id_str = id.to_string();

            sqlx::query(
                "INSERT INTO widget_dashboards \
                 (id, cloud_id, house_id, user_id, name, is_default, \
                  layouts, widgets, created_at, updated_at, last_pushed_at) \
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(&id_str)
            .bind(cloud_id)
            .bind(&cmd.house_id)
            .bind(&cmd.user_id)
            .bind(&cmd.name)
            .bind(is_default)
            .bind(&layouts_json)
            .bind(&widgets_json)
            .bind(&now)
            .bind(&cloud_ts)
            .bind(&cloud_ts)
            .execute(&self.pool)
            .await
            .map_err(db_err)?;

            self.find_by_id(&id)
                .await?
                .ok_or_else(|| DomainError::not_found("widget_dashboard", id_str))
        }
    }

    async fn list_without_cloud_id(&self) -> Result<Vec<WidgetDashboard>, DomainError> {
        let rows = sqlx::query(&format!(
            "SELECT {SELECT_COLS} FROM widget_dashboards \
             WHERE cloud_id IS NULL ORDER BY created_at ASC",
        ))
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        rows.iter().map(row_to_entity).collect()
    }

    async fn list_with_cloud_id(&self) -> Result<Vec<WidgetDashboard>, DomainError> {
        let rows = sqlx::query(&format!(
            "SELECT {SELECT_COLS} FROM widget_dashboards \
             WHERE cloud_id IS NOT NULL ORDER BY updated_at DESC",
        ))
        .fetch_all(&self.pool)
        .await
        .map_err(db_err)?;

        rows.iter().map(row_to_entity).collect()
    }

    async fn set_cloud_id(&self, id: &Uuid, cloud_id: &str) -> Result<(), DomainError> {
        sqlx::query("UPDATE widget_dashboards SET cloud_id = ? WHERE id = ?")
            .bind(cloud_id)
            .bind(id.to_string())
            .execute(&self.pool)
            .await
            .map_err(db_err)?;
        Ok(())
    }

    async fn mark_pushed_at(&self, id: &Uuid, at: chrono::DateTime<Utc>) -> Result<(), DomainError> {
        let ts = at.to_rfc3339();
        sqlx::query(
            "UPDATE widget_dashboards SET last_pushed_at = ?, updated_at = ? WHERE id = ?",
        )
        .bind(&ts)
        .bind(&ts)
        .bind(id.to_string())
        .execute(&self.pool)
        .await
        .map_err(db_err)?;
        Ok(())
    }
}