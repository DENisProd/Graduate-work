use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get, post},
    Json, Router,
};
use local_server_application::ports::modbus_repository::{
    CreateModbusDeviceCmd, CreateModbusRegisterCmd, ModbusRepository, SaveModbusStateCmd,
};
use local_server_application::ports::{ModbusBridgePort, MqttClient};
use local_server_core::entities::modbus::{
    ModbusDevice, ModbusRegister, ModbusRegisterState, RegisterType,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::error::AppError;

// ─── State ───────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct ModbusHttpState {
    pub repo: Arc<dyn ModbusRepository>,
    pub gateway: Arc<dyn ModbusBridgePort>,
    pub mqtt: Arc<dyn MqttClient>,
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModbusDeviceResponse {
    pub id: String,
    pub name: String,
    pub slave_id: i64,
    pub description: Option<String>,
    pub enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl From<ModbusDevice> for ModbusDeviceResponse {
    fn from(d: ModbusDevice) -> Self {
        Self {
            id: d.id.to_string(),
            name: d.name,
            slave_id: d.slave_id,
            description: d.description,
            enabled: d.enabled,
            created_at: d.created_at.to_rfc3339(),
            updated_at: d.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModbusRegisterResponse {
    pub id: String,
    pub device_id: String,
    pub name: String,
    pub register_type: String,
    pub address: i64,
    pub count: i64,
    pub unit: Option<String>,
    pub scale_factor: f64,
    pub offset: f64,
    pub writable: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl From<ModbusRegister> for ModbusRegisterResponse {
    fn from(r: ModbusRegister) -> Self {
        Self {
            id: r.id.to_string(),
            device_id: r.device_id.to_string(),
            name: r.name,
            register_type: r.register_type.as_str().to_string(),
            address: r.address,
            count: r.count,
            unit: r.unit,
            scale_factor: r.scale_factor,
            offset: r.offset,
            writable: r.writable,
            created_at: r.created_at.to_rfc3339(),
            updated_at: r.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModbusStateResponse {
    pub register_id: String,
    pub raw_values: Vec<serde_json::Value>,
    pub scaled_values: Vec<f64>,
    pub timestamp: String,
}

impl From<ModbusRegisterState> for ModbusStateResponse {
    fn from(s: ModbusRegisterState) -> Self {
        Self {
            register_id: s.register_id.to_string(),
            raw_values: s.raw_values,
            scaled_values: s.scaled_values,
            timestamp: s.timestamp.to_rfc3339(),
        }
    }
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDeviceBody {
    pub name: String,
    pub slave_id: i64,
    pub description: Option<String>,
    #[serde(default = "default_true")]
    pub enabled: bool,
}

fn default_true() -> bool { true }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRegisterBody {
    pub name: String,
    pub register_type: String,
    pub address: i64,
    #[serde(default = "default_one")]
    pub count: i64,
    pub unit: Option<String>,
    #[serde(default = "default_one_f")]
    pub scale_factor: f64,
    #[serde(default)]
    pub offset: f64,
    #[serde(default)]
    pub writable: bool,
}

fn default_one() -> i64 { 1 }
fn default_one_f() -> f64 { 1.0 }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteRegisterBody {
    #[serde(default)]
    pub value: Option<u16>,
    #[serde(default)]
    pub values: Option<Vec<u16>>,
    #[serde(default)]
    pub coil: Option<bool>,
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async fn list_devices(
    State(s): State<ModbusHttpState>,
) -> Result<Json<Vec<ModbusDeviceResponse>>, AppError> {
    let devs = s.repo.list_devices().await?;
    Ok(Json(devs.into_iter().map(Into::into).collect()))
}

async fn create_device(
    State(s): State<ModbusHttpState>,
    Json(body): Json<CreateDeviceBody>,
) -> Result<(StatusCode, Json<ModbusDeviceResponse>), AppError> {
    let dev = s
        .repo
        .create_device(CreateModbusDeviceCmd {
            name: body.name,
            slave_id: body.slave_id,
            description: body.description,
            enabled: body.enabled,
        })
        .await?;
    Ok((StatusCode::CREATED, Json(dev.into())))
}

async fn get_device(
    State(s): State<ModbusHttpState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ModbusDeviceResponse>, AppError> {
    let dev = s
        .repo
        .find_device(id)
        .await?
        .ok_or_else(|| local_server_application::DomainError::NotFound {
            entity: "ModbusDevice".into(),
            id: id.to_string(),
        })?;
    Ok(Json(dev.into()))
}

async fn delete_device(
    State(s): State<ModbusHttpState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    s.repo.delete_device(id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// ─── Registers ────────────────────────────────────────────────────────────────

async fn list_registers(
    State(s): State<ModbusHttpState>,
    Path(device_id): Path<Uuid>,
) -> Result<Json<Vec<ModbusRegisterResponse>>, AppError> {
    let regs = s.repo.list_registers(device_id).await?;
    Ok(Json(regs.into_iter().map(Into::into).collect()))
}

async fn create_register(
    State(s): State<ModbusHttpState>,
    Path(device_id): Path<Uuid>,
    Json(body): Json<CreateRegisterBody>,
) -> Result<(StatusCode, Json<ModbusRegisterResponse>), AppError> {
    let rt = RegisterType::from_str(&body.register_type)
        .ok_or_else(|| {
            local_server_application::DomainError::Validation(format!(
                "Unknown register_type '{}'. Use: holding, input, coil, discrete",
                body.register_type
            ))
        })?;

    let reg = s
        .repo
        .create_register(CreateModbusRegisterCmd {
            device_id,
            name: body.name,
            register_type: rt,
            address: body.address,
            count: body.count,
            unit: body.unit,
            scale_factor: body.scale_factor,
            offset: body.offset,
            writable: body.writable,
        })
        .await?;
    Ok((StatusCode::CREATED, Json(reg.into())))
}

async fn delete_register(
    State(s): State<ModbusHttpState>,
    Path((_device_id, reg_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, AppError> {
    s.repo.delete_register(reg_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// ─── Read / Write via MQTT bridge ─────────────────────────────────────────────

async fn read_register(
    State(s): State<ModbusHttpState>,
    Path((_device_id, reg_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<ModbusStateResponse>, AppError> {
    let reg = s
        .repo
        .find_register(reg_id)
        .await?
        .ok_or_else(|| local_server_application::DomainError::NotFound {
            entity: "ModbusRegister".into(),
            id: reg_id.to_string(),
        })?;

    let dev = s
        .repo
        .find_device(reg.device_id)
        .await?
        .ok_or_else(|| local_server_application::DomainError::NotFound {
            entity: "ModbusDevice".into(),
            id: reg.device_id.to_string(),
        })?;

    let action = match reg.register_type {
        RegisterType::Holding  => "read_holding_registers",
        RegisterType::Input    => "read_input_registers",
        RegisterType::Coil     => "read_coils",
        RegisterType::Discrete => "read_discrete_inputs",
    };

    let cmd = serde_json::json!({
        "action":   action,
        "slave_id": dev.slave_id,
        "address":  reg.address,
        "count":    reg.count,
    });

    let data = s.gateway.execute(s.mqtt.clone(), cmd).await?;

    // Parse the raw values returned by the bridge.
    let raw: Vec<serde_json::Value> = data
        .get("values")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let scaled: Vec<f64> = raw
        .iter()
        .map(|v| {
            let raw_f = v.as_f64().unwrap_or(0.0);
            raw_f * reg.scale_factor + reg.offset
        })
        .collect();

    s.repo
        .save_state(SaveModbusStateCmd {
            register_id: reg.id,
            raw_values: raw.clone(),
            scaled_values: scaled.clone(),
        })
        .await?;

    Ok(Json(ModbusStateResponse {
        register_id: reg.id.to_string(),
        raw_values: raw,
        scaled_values: scaled,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn write_register(
    State(s): State<ModbusHttpState>,
    Path((_device_id, reg_id)): Path<(Uuid, Uuid)>,
    Json(body): Json<WriteRegisterBody>,
) -> Result<StatusCode, AppError> {
    let reg = s
        .repo
        .find_register(reg_id)
        .await?
        .ok_or_else(|| local_server_application::DomainError::NotFound {
            entity: "ModbusRegister".into(),
            id: reg_id.to_string(),
        })?;

    if !reg.writable {
        return Err(local_server_application::DomainError::Validation(
            "Register is not writable".into(),
        )
        .into());
    }

    let dev = s
        .repo
        .find_device(reg.device_id)
        .await?
        .ok_or_else(|| local_server_application::DomainError::NotFound {
            entity: "ModbusDevice".into(),
            id: reg.device_id.to_string(),
        })?;

    let cmd = match reg.register_type {
        RegisterType::Coil => {
            let v = body.coil.ok_or_else(|| {
                local_server_application::DomainError::Validation(
                    "Coil write requires 'coil' boolean field".into(),
                )
            })?;
            serde_json::json!({
                "action":   "write_single_coil",
                "slave_id": dev.slave_id,
                "address":  reg.address,
                "value":    v,
            })
        }
        RegisterType::Holding if body.values.is_some() => {
            serde_json::json!({
                "action":   "write_multiple_registers",
                "slave_id": dev.slave_id,
                "address":  reg.address,
                "values":   body.values.unwrap(),
            })
        }
        RegisterType::Holding => {
            let v = body.value.ok_or_else(|| {
                local_server_application::DomainError::Validation(
                    "Holding register write requires 'value' (u16) or 'values' ([u16]) field".into(),
                )
            })?;
            serde_json::json!({
                "action":   "write_single_register",
                "slave_id": dev.slave_id,
                "address":  reg.address,
                "value":    v,
            })
        }
        _ => {
            return Err(local_server_application::DomainError::Validation(
                "Only holding registers and coils are writable".into(),
            )
            .into());
        }
    };

    s.gateway.execute(s.mqtt.clone(), cmd).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn get_device_state(
    State(s): State<ModbusHttpState>,
    Path(device_id): Path<Uuid>,
) -> Result<Json<Vec<ModbusStateResponse>>, AppError> {
    let states = s.repo.get_device_states(device_id).await?;
    Ok(Json(states.into_iter().map(Into::into).collect()))
}

// ─── Router ───────────────────────────────────────────────────────────────────

pub fn router(
    repo: Arc<dyn ModbusRepository>,
    gateway: Arc<dyn ModbusBridgePort>,
    mqtt: Arc<dyn MqttClient>,
) -> Router {
    let state = ModbusHttpState { repo, gateway, mqtt };

    Router::new()
        // devices
        .route("/modbus/devices",     get(list_devices).post(create_device))
        .route("/modbus/devices/:id", get(get_device).delete(delete_device))
        // registers
        .route("/modbus/devices/:id/registers",
            get(list_registers).post(create_register))
        .route("/modbus/devices/:id/registers/:reg_id",
            delete(delete_register))
        // read / write via MQTT bridge
        .route("/modbus/devices/:id/registers/:reg_id/read",
            post(read_register))
        .route("/modbus/devices/:id/registers/:reg_id/write",
            post(write_register))
        // latest cached state for all registers of a device
        .route("/modbus/devices/:id/state",
            get(get_device_state))
        .with_state(state)
}
