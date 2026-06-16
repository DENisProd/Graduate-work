use std::sync::Arc;
use std::time::Duration;

use crate::ports::{
    AccessSyncRepository, CloudModbusClient, CreateCloudModbusDeviceCmd,
    CreateCloudModbusRegisterCmd, ModbusRepository, RemoteModbusDevice, RemoteModbusRegister,
};
use crate::services::{ScenarioServiceUrlProvider, UserIdProvider};
use local_server_core::entities::modbus::ModbusRegister;
use local_server_core::DomainError;

pub type ModbusIdMap = (Vec<(String, String)>, Vec<(String, String)>);

pub async fn run_modbus_sync(
    repo: Arc<dyn ModbusRepository>,
    cloud: Arc<dyn CloudModbusClient>,
    interval_secs: u64,
    scenario_service_url: Arc<dyn ScenarioServiceUrlProvider>,
    access_sync: Arc<dyn AccessSyncRepository>,
    user_id_provider: Arc<dyn UserIdProvider>,
) {
    loop {
        let base_url = scenario_service_url.get().await;
        let house_id = resolve_primary_house_id(&access_sync, &user_id_provider).await;
        if let Err(e) = sync_once(&repo, &cloud, &base_url, house_id.as_deref()).await {
            tracing::warn!(error = %e, scenario_base = %base_url, "modbus_sync: cycle failed");
        }
        tokio::time::sleep(Duration::from_secs(interval_secs)).await;
    }
}

pub async fn resolve_primary_house_id(
    access_sync: &Arc<dyn AccessSyncRepository>,
    user_id_provider: &Arc<dyn UserIdProvider>,
) -> Option<String> {
    let user_id = user_id_provider.get().await?;
    access_sync
        .list_houses(&user_id)
        .await
        .ok()?
        .first()
        .map(|h| h.id.clone())
}

pub async fn sync_once(
    repo: &Arc<dyn ModbusRepository>,
    cloud: &Arc<dyn CloudModbusClient>,
    base_url: &str,
    house_id: Option<&str>,
) -> Result<ModbusIdMap, DomainError> {
    let locals = repo.list_devices().await?;
    let local_count = locals.len();
    let mut cloud_devices = cloud.list_devices(base_url).await?;
    let mut device_map: Vec<(String, String)> = Vec::new();
    let mut register_map: Vec<(String, String)> = Vec::new();

    for local in locals {
        let local_id = local.id.to_string();
        let cloud_dev = if let Some(existing) = cloud_devices.iter().find(|d| d.slave_id == local.slave_id) {
            ensure_cloud_house(cloud, base_url, existing, house_id).await?;
            existing.clone()
        } else {
            let created = cloud
                .create_device(
                    base_url,
                    CreateCloudModbusDeviceCmd {
                        name: local.name.clone(),
                        slave_id: local.slave_id,
                        description: local.description.clone(),
                        enabled: local.enabled,
                        house_id: house_id.map(str::to_string),
                    },
                )
                .await?;
            cloud_devices.push(created.clone());
            tracing::info!(
                local_id = %local_id,
                cloud_id = %created.cloud_id,
                slave_id = local.slave_id,
                house_id = house_id.unwrap_or(""),
                "modbus_sync: pushed device to cloud"
            );
            created
        };
        device_map.push((local_id.clone(), cloud_dev.cloud_id.clone()));

        let local_regs = repo.list_registers(local.id).await?;
        let cloud_regs = cloud
            .list_registers(base_url, &cloud_dev.cloud_id)
            .await?;
        for reg in local_regs {
            sync_register(base_url, cloud, &cloud_dev.cloud_id, &cloud_regs, &reg, &mut register_map).await?;
        }
    }

    if local_count > 0 {
        tracing::info!(
            local_devices = local_count,
            mapped_devices = device_map.len(),
            mapped_registers = register_map.len(),
            house_id = house_id.unwrap_or(""),
            "modbus_sync: cycle complete"
        );
    }

    Ok((device_map, register_map))
}

async fn ensure_cloud_house(
    cloud: &Arc<dyn CloudModbusClient>,
    base_url: &str,
    existing: &RemoteModbusDevice,
    house_id: Option<&str>,
) -> Result<(), DomainError> {
    let Some(hid) = house_id else {
        return Ok(());
    };
    if existing.house_id.as_deref() == Some(hid) {
        return Ok(());
    }
    cloud
        .update_device_house(base_url, &existing.cloud_id, hid)
        .await?;
    tracing::info!(
        cloud_id = %existing.cloud_id,
        house_id = hid,
        "modbus_sync: assigned house to cloud device"
    );
    Ok(())
}

async fn sync_register(
    base_url: &str,
    cloud: &Arc<dyn CloudModbusClient>,
    cloud_device_id: &str,
    cloud_regs: &[RemoteModbusRegister],
    local: &ModbusRegister,
    register_map: &mut Vec<(String, String)>,
) -> Result<(), DomainError> {
    let local_id = local.id.to_string();
    let reg_type = local.register_type.as_str().to_string();
    if let Some(existing) = cloud_regs.iter().find(|r| {
        r.register_type == reg_type && r.address == local.address
    }) {
        register_map.push((local_id, existing.cloud_id.clone()));
        return Ok(());
    }

    let created = cloud
        .create_register(
            base_url,
            cloud_device_id,
            CreateCloudModbusRegisterCmd {
                name: local.name.clone(),
                register_type: reg_type,
                address: local.address,
                count: local.count,
                unit: local.unit.clone(),
                scale_factor: local.scale_factor,
                offset: local.offset,
                writable: local.writable,
            },
        )
        .await?;
    let cloud_id = created.cloud_id.clone();
    register_map.push((local_id, created.cloud_id));
    tracing::info!(
        local_id = %local.id,
        cloud_id = %cloud_id,
        "modbus_sync: pushed register to cloud"
    );
    Ok(())
}
