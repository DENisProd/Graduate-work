use std::sync::Arc;
use std::time::Duration;

use local_server_application::ports::{
    CloudModbusClient, CreateCloudModbusDeviceCmd, CreateCloudModbusRegisterCmd, ModbusRepository,
};
use local_server_application::services::ScenarioServiceUrlProvider;
use local_server_core::entities::modbus::ModbusRegister;

pub type ModbusIdMap = (Vec<(String, String)>, Vec<(String, String)>);

pub async fn run_modbus_sync(
    repo: Arc<dyn ModbusRepository>,
    cloud: Arc<dyn CloudModbusClient>,
    interval_secs: u64,
    scenario_service_url: Arc<dyn ScenarioServiceUrlProvider>,
) {
    loop {
        let base_url = scenario_service_url.get().await;
        if let Err(e) = sync_once(&repo, &cloud, &base_url).await {
            tracing::warn!(error = %e, "modbus_sync: cycle failed");
        }
        tokio::time::sleep(Duration::from_secs(interval_secs)).await;
    }
}

pub async fn sync_once(
    repo: &Arc<dyn ModbusRepository>,
    cloud: &Arc<dyn CloudModbusClient>,
    base_url: &str,
) -> Result<ModbusIdMap, local_server_core::DomainError> {
    let locals = repo.list_devices().await?;
    let mut cloud_devices = cloud.list_devices(base_url).await.unwrap_or_default();
    let mut device_map: Vec<(String, String)> = Vec::new();
    let mut register_map: Vec<(String, String)> = Vec::new();

    for local in locals {
        let local_id = local.id.to_string();
        let cloud_dev = if let Some(existing) = cloud_devices.iter().find(|d| d.slave_id == local.slave_id) {
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
                    },
                )
                .await?;
            cloud_devices.push(created.clone());
            tracing::info!(
                local_id = %local_id,
                cloud_id = %created.cloud_id,
                slave_id = local.slave_id,
                "modbus_sync: pushed device to cloud"
            );
            created
        };
        device_map.push((local_id.clone(), cloud_dev.cloud_id.clone()));

        let local_regs = repo.list_registers(local.id).await?;
        let cloud_regs = cloud
            .list_registers(base_url, &cloud_dev.cloud_id)
            .await
            .unwrap_or_default();
        for reg in local_regs {
            sync_register(base_url, cloud, &cloud_dev.cloud_id, &cloud_regs, &reg, &mut register_map).await?;
        }
    }

    Ok((device_map, register_map))
}

async fn sync_register(
    base_url: &str,
    cloud: &Arc<dyn CloudModbusClient>,
    cloud_device_id: &str,
    cloud_regs: &[local_server_application::ports::RemoteModbusRegister],
    local: &ModbusRegister,
    register_map: &mut Vec<(String, String)>,
) -> Result<(), local_server_core::DomainError> {
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
    register_map.push((local_id, created.cloud_id));
    tracing::info!(
        local_id = %local.id,
        cloud_id = %created.cloud_id,
        "modbus_sync: pushed register to cloud"
    );
    Ok(())
}
