use local_server_application::DomainError;
use sqlx::SqlitePool;

fn db_err(e: sqlx::Error) -> DomainError {
    DomainError::Internal(e.to_string())
}

/// Wipes operational local data while keeping runtime settings and device catalog seeds.
pub async fn reset_local_data(pool: &SqlitePool) -> Result<(), DomainError> {
    let mut tx = pool.begin().await.map_err(db_err)?;

    sqlx::query("PRAGMA foreign_keys = OFF")
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;

    const TABLES: &[&str] = &[
        "modbus_states",
        "modbus_registers",
        "modbus_devices",
        "zigbee_device_logs",
        "zigbee_device_states",
        "device_network_links",
        "device_data",
        "scenario_executions",
        "scenarios",
        "widget_dashboards",
        "sync_outbox",
        "effective_permissions_v2",
        "access_rights_v2",
        "resources_v2",
        "effective_permissions",
        "access_rights",
        "access_policies",
        "resources",
        "house_invitations",
        "access_audit_log",
        "house_member_roles",
        "cloud_house_members",
        "house_members",
        "house_roles",
        "houses",
        "physical_devices",
        "devices",
    ];

    for table in TABLES {
        let sql = format!("DELETE FROM {table}");
        sqlx::query(&sql).execute(&mut *tx).await.map_err(db_err)?;
    }

    sqlx::query("UPDATE sync_versions SET last_pulled_at = NULL, last_pushed_at = NULL")
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;

    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;

    tx.commit().await.map_err(db_err)?;
    Ok(())
}
