use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use chrono::Utc;
use serde_json::Value;
use tokio::sync::broadcast;

use local_server_application::{
    ports::{
        ModbusRepository,
        PhysicalDeviceRepository,
        ZigbeeRepository,
        modbus_repository::{CreateModbusDeviceCmd, CreateModbusRegisterCmd},
        physical_device_repository::UpsertFromBridgeCmd,
    },
    services::ZigbeeRealtimeService,
};
use local_server_core::entities::{
    modbus::RegisterType,
    scan_log::{ScanLog, ScanLogDevice, ScanLogEntry, SCAN_LOG_CAPACITY},
    zigbee::{PairingEvent, ZigbeeDeviceState, ZigbeeMetrics},
};

use super::client::MqttMessage;
use super::modbus_gateway::ModbusGateway;

#[derive(Default)]
struct IngestState {
    friendly_to_ieee: HashMap<String, String>,
    telemetry_seen: HashSet<String>,
    bridge_snapshot_seen: bool,
}

pub async fn run_ingestion(
    mut rx: broadcast::Receiver<MqttMessage>,
    zigbee_repo: Arc<dyn ZigbeeRepository>,
    phys_repo: Arc<dyn PhysicalDeviceRepository>,
    realtime_svc: Arc<ZigbeeRealtimeService>,
    prefix: String,
    modbus_gateway: Option<Arc<ModbusGateway>>,
    modbus_repo: Arc<dyn ModbusRepository>,
    scan_log: ScanLog,
) {
    tracing::info!(prefix = %prefix, "MQTT ingestion started");
    let mut state = IngestState::default();
    loop {
        match rx.recv().await {
            Ok(msg) => {
                // Route modbus topics before the zigbee prefix check.
                if msg.topic == "modbus/response" {
                    tracing::info!(
                        bytes = msg.payload.len(),
                        "modbus: ingest received modbus/response",
                    );
                    if let Some(gw) = &modbus_gateway {
                        gw.on_response(&msg.payload);
                    } else {
                        tracing::warn!("modbus: received modbus/response but gateway is None");
                    }
                    continue;
                }
                if msg.topic == "modbus/discovered" {
                    handle_modbus_discovered(&msg.payload, &modbus_repo, &scan_log).await;
                    continue;
                }
                handle_message(
                    &msg,
                    &zigbee_repo,
                    &phys_repo,
                    &realtime_svc,
                    &prefix,
                    &mut state,
                )
                .await
            }
            Err(broadcast::error::RecvError::Lagged(n)) => {
                tracing::warn!(dropped = n, "MQTT ingestion lagged, messages dropped");
            }
            Err(broadcast::error::RecvError::Closed) => {
                tracing::info!("MQTT channel closed, stopping ingestion");
                break;
            }
        }
    }
}

async fn handle_message(
    msg: &MqttMessage,
    zigbee_repo: &Arc<dyn ZigbeeRepository>,
    phys_repo: &Arc<dyn PhysicalDeviceRepository>,
    svc: &Arc<ZigbeeRealtimeService>,
    prefix: &str,
    state: &mut IngestState,
) {
    let Some(suffix) = msg.topic.strip_prefix(prefix) else { return };
    let suffix = suffix.trim_start_matches('/');

    match suffix {
        "bridge/devices" => handle_bridge_devices(&msg.payload, phys_repo, state).await,
        "bridge/event" => handle_bridge_event(&msg.payload, svc).await,
        "bridge/state" => handle_bridge_state(&msg.payload, svc).await,
        s if s.starts_with("bridge/") => {}
        device if !device.is_empty() && !device.contains('/') => {
            handle_device_telemetry(
                device,
                &msg.payload,
                zigbee_repo,
                phys_repo,
                svc,
                state,
            )
            .await;
        }
        _ => {}
    }
}

async fn handle_bridge_devices(
    payload: &[u8],
    phys_repo: &Arc<dyn PhysicalDeviceRepository>,
    state: &mut IngestState,
) {
    let devices: Vec<Value> = match serde_json::from_slice(payload) {
        Ok(Value::Array(arr)) => arr,
        _ => return,
    };

    let mut new_in_session = 0usize;
    let mut new_in_db = 0usize;

    for dev in &devices {
        let ieee = match dev["ieee_address"].as_str() {
            Some(s) => s.to_owned(),
            None => continue,
        };
        let friendly = dev["friendly_name"]
            .as_str()
            .unwrap_or(&ieee)
            .to_owned();

        let is_new_in_session = !state.friendly_to_ieee.contains_key(&friendly);
        state
            .friendly_to_ieee
            .insert(friendly.clone(), ieee.clone());
        if is_new_in_session {
            new_in_session += 1;
        }

        let definition = if dev["definition"].is_null() || !dev["definition"].is_object() {
            None
        } else {
            Some(dev["definition"].clone())
        };

        let model = dev["model_id"]
            .as_str()
            .or_else(|| dev["definition"]["model"].as_str())
            .map(str::to_owned);

        let manufacturer = dev["manufacturer"]
            .as_str()
            .or_else(|| dev["definition"]["vendor"].as_str())
            .map(str::to_owned);

        let interview_completed = dev["interview_completed"].as_bool().unwrap_or(false);

        let existed_before = phys_repo
            .find_by_ieee(&ieee)
            .await
            .ok()
            .flatten()
            .is_some();
        if !existed_before {
            new_in_db += 1;
            tracing::info!(
                ieee = %ieee,
                friendly = %friendly,
                model = model.as_deref().unwrap_or("?"),
                vendor = manufacturer.as_deref().unwrap_or("?"),
                interview_completed,
                "Zigbee device connected (first time seen, added to DB)"
            );
        } else if is_new_in_session && state.bridge_snapshot_seen {
            tracing::info!(
                ieee = %ieee,
                friendly = %friendly,
                model = model.as_deref().unwrap_or("?"),
                vendor = manufacturer.as_deref().unwrap_or("?"),
                interview_completed,
                "Zigbee device reappeared in bridge/devices snapshot"
            );
        }

        let cmd = UpsertFromBridgeCmd {
            ieee_address: ieee.clone(),
            friendly_name: Some(friendly),
            device_type: dev["type"].as_str().map(str::to_owned),
            network_address: dev["network_address"].as_i64(),
            manufacturer_name: manufacturer,
            model,
            firmware_version: dev["software_build_id"].as_str().map(str::to_owned),
            power_source: dev["power_source"].as_str().map(str::to_owned),
            interview_completed,
            definition,
        };

        if let Err(e) = phys_repo.upsert_by_ieee(cmd).await {
            tracing::warn!(ieee = %ieee, error = %e, "failed to upsert device from bridge/devices");
        }
    }

    if !state.bridge_snapshot_seen {
        tracing::info!(
            total = devices.len(),
            new_in_db = new_in_db,
            "bridge/devices: initial snapshot received, paired devices loaded"
        );
        state.bridge_snapshot_seen = true;
    } else if new_in_session > 0 || new_in_db > 0 {
        tracing::info!(
            total = devices.len(),
            new_in_session = new_in_session,
            new_in_db = new_in_db,
            "bridge/devices: snapshot updated"
        );
    } else {
        tracing::debug!(count = devices.len(), "bridge/devices: synced devices");
    }
}

async fn handle_bridge_event(payload: &[u8], svc: &Arc<ZigbeeRealtimeService>) {
    let v: Value = match serde_json::from_slice(payload) {
        Ok(v) => v,
        Err(_) => return,
    };

    let event_type = match v["type"].as_str() {
        Some(t) => t,
        None => return,
    };

    let data = &v["data"];
    let ieee = data["ieee_address"].as_str().map(str::to_owned);
    let friendly = data["friendly_name"].as_str().map(str::to_owned);

    let pairing_event_type = match event_type {
        "device_joined" => Some("device_joined"),
        "device_announce" => Some("device_joined"),
        "device_leave" => Some("device_leave"),
        "device_interview" => {
            match data["status"].as_str() {
                Some("interview_started") => Some("interview_started"),
                Some("interview_successful") | Some("interview_done") => Some("interview_successful"),
                Some("interview_failed") => Some("interview_failed"),
                _ => None,
            }
        }
        _ => None,
    };

    if let Some(evt_type) = pairing_event_type {
        let model = data["definition"]["model"]
            .as_str()
            .or_else(|| data["model_id"].as_str())
            .map(str::to_owned);
        let manufacturer = data["definition"]["vendor"]
            .as_str()
            .or_else(|| data["manufacturer"].as_str())
            .map(str::to_owned);
        let message = data["error"].as_str().map(str::to_owned);

        let log_ieee = ieee.as_deref().unwrap_or("?");
        let log_friendly = friendly.as_deref().unwrap_or("?");
        let log_model = model.as_deref().unwrap_or("?");
        let log_vendor = manufacturer.as_deref().unwrap_or("?");
        match evt_type {
            "device_joined" => tracing::info!(
                ieee = %log_ieee,
                friendly = %log_friendly,
                model = %log_model,
                vendor = %log_vendor,
                "Zigbee device joined network"
            ),
            "interview_started" => tracing::info!(
                ieee = %log_ieee,
                friendly = %log_friendly,
                "Zigbee device interview started"
            ),
            "interview_successful" => tracing::info!(
                ieee = %log_ieee,
                friendly = %log_friendly,
                model = %log_model,
                vendor = %log_vendor,
                "Zigbee device interview successful (device ready)"
            ),
            "interview_failed" => tracing::warn!(
                ieee = %log_ieee,
                friendly = %log_friendly,
                error = message.as_deref().unwrap_or(""),
                "Zigbee device interview failed"
            ),
            "device_leave" => tracing::info!(
                ieee = %log_ieee,
                friendly = %log_friendly,
                "Zigbee device left network"
            ),
            _ => {}
        }

        svc.publish_pairing(PairingEvent {
            event_type: evt_type.to_owned(),
            ieee_address: ieee,
            friendly_name: friendly,
            model,
            manufacturer_name: manufacturer,
            message,
            timestamp: Utc::now(),
        });
    }
}

async fn handle_bridge_state(payload: &[u8], svc: &Arc<ZigbeeRealtimeService>) {
    let v: Value = match serde_json::from_slice(payload) {
        Ok(v) => v,
        Err(_) => return,
    };
    if let Some(enabled) = v["permit_join"].as_bool() {
        tracing::info!(
            permit_join = enabled,
            "Zigbee bridge state: permit_join {}",
            if enabled { "enabled (pairing mode ON)" } else { "disabled" }
        );
        svc.publish_permit_join(enabled);
    }
}

async fn handle_device_telemetry(
    friendly_name: &str,
    payload: &[u8],
    zigbee_repo: &Arc<dyn ZigbeeRepository>,
    phys_repo: &Arc<dyn PhysicalDeviceRepository>,
    svc: &Arc<ZigbeeRealtimeService>,
    state: &mut IngestState,
) {
    let raw: Value = match serde_json::from_slice(payload) {
        Ok(v) => v,
        Err(e) => {
            tracing::debug!(device = friendly_name, error = %e, "non-JSON zigbee payload");
            return;
        }
    };

    // Resolve IEEE address: prefer the mapping built from bridge/devices,
    // fall back to the friendly_name itself (which may already be an IEEE addr).
    let ieee_addr = state
        .friendly_to_ieee
        .get(friendly_name)
        .cloned()
        .unwrap_or_else(|| friendly_name.to_owned());

    if state.telemetry_seen.insert(ieee_addr.clone()) {
        tracing::info!(
            ieee = %ieee_addr,
            friendly = %friendly_name,
            "Zigbee device started reporting telemetry"
        );
    }

    let metrics = normalize_payload(&raw);
    let device_state = ZigbeeDeviceState {
        device_ieee_addr: ieee_addr.clone(),
        timestamp: Utc::now(),
        payload: raw,
        state: metrics.state.clone(),
        brightness: metrics.brightness,
        linkquality: metrics.linkquality,
        color_mode: metrics.color_mode.clone(),
        occupancy: metrics.occupancy,
        temperature: metrics.temperature,
        humidity: metrics.humidity,
        battery: metrics.battery,
    };

    if let Err(e) = zigbee_repo.insert_state(&device_state).await {
        tracing::warn!(device = friendly_name, error = %e, "failed to persist zigbee state");
    }

    phys_repo.update_last_seen(&ieee_addr).await.ok();

    svc.publish_state(device_state);
}

fn normalize_payload(v: &Value) -> ZigbeeMetrics {
    ZigbeeMetrics {
        state: parse_state(v),
        brightness: v["brightness"].as_i64(),
        temperature: v["temperature"].as_f64(),
        humidity: v["humidity"].as_f64(),
        battery: v["battery"].as_f64(),
        occupancy: parse_bool(v, &["occupancy", "motion"]),
        linkquality: v["linkquality"].as_i64(),
        color_mode: v["color_mode"]
            .as_str()
            .or_else(|| v["colorMode"].as_str())
            .map(str::to_owned),
    }
}

fn parse_state(v: &Value) -> Option<String> {
    match &v["state"] {
        Value::String(s) => Some(s.to_uppercase()),
        Value::Bool(b) => Some(if *b { "ON" } else { "OFF" }.to_owned()),
        Value::Number(n) => {
            if n.as_i64() == Some(1) { Some("ON".to_owned()) }
            else if n.as_i64() == Some(0) { Some("OFF".to_owned()) }
            else { None }
        }
        _ => None,
    }
}

fn parse_bool(v: &Value, keys: &[&str]) -> Option<bool> {
    for key in keys {
        let field = &v[key];
        match field {
            Value::Bool(b) => return Some(*b),
            Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    return Some(i != 0);
                }
            }
            Value::String(s) => {
                let lower = s.to_lowercase();
                if matches!(lower.as_str(), "true" | "yes" | "on" | "1") {
                    return Some(true);
                } else if matches!(lower.as_str(), "false" | "no" | "off" | "0") {
                    return Some(false);
                }
            }
            _ => {}
        }
    }
    None
}

async fn handle_modbus_discovered(
    payload: &[u8],
    modbus_repo: &Arc<dyn ModbusRepository>,
    scan_log: &ScanLog,
) {
    let v: Value = match serde_json::from_slice(payload) {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!(error = %e, "modbus/discovered: invalid JSON payload");
            return;
        }
    };

    let discovered = match v["discovered"].as_array() {
        Some(arr) => arr.clone(),
        None => return,
    };

    if discovered.is_empty() {
        tracing::info!("modbus/discovered: scan found no devices on the bus");
        return;
    }

    let existing = match modbus_repo.list_devices().await {
        Ok(devs) => devs,
        Err(e) => {
            tracing::warn!(error = %e, "modbus/discovered: cannot load existing devices");
            return;
        }
    };

    let mut registered = 0usize;
    let mut log_devices: Vec<ScanLogDevice> = Vec::new();
    for entry in &discovered {
        let slave_id = match entry["slave_id"].as_i64() {
            Some(id) => id,
            None => continue,
        };
        let baud_rate = entry["baud_rate"].as_u64().unwrap_or(9600);

        let coils_preview    = entry["coils"].as_u64().unwrap_or(0) as u16;
        let discrete_preview = entry["discrete_inputs"].as_u64().unwrap_or(0) as u16;
        let holding_preview  = entry["holding_registers"].as_u64().unwrap_or(0) as u16;
        let input_preview    = entry["input_registers"].as_u64().unwrap_or(0) as u16;

        let is_new = !existing.iter().any(|d| d.slave_id == slave_id);
        if !is_new {
            tracing::debug!(slave_id, "modbus/discovered: already registered, skipping");
            log_devices.push(ScanLogDevice {
                slave_id,
                baud_rate: baud_rate as u64,
                coils: coils_preview,
                discrete_inputs: discrete_preview,
                holding_registers: holding_preview,
                input_registers: input_preview,
                is_new: false,
                name: existing
                    .iter()
                    .find(|d| d.slave_id == slave_id)
                    .map(|d| d.name.clone())
                    .unwrap_or_default(),
            });
            continue;
        }

        let device_name = classify_device_name(slave_id, coils_preview, discrete_preview, holding_preview, input_preview);

        let device = match modbus_repo
            .create_device(CreateModbusDeviceCmd {
                name: device_name,
                slave_id,
                description: Some(format!(
                    "Автоматически обнаружено. Скорость: {} бод. Coil: {}, Discrete: {}, Holding: {}, Input: {}",
                    baud_rate, coils_preview, discrete_preview, holding_preview, input_preview,
                )),
                enabled: true,
            })
            .await
        {
            Ok(d) => d,
            Err(e) => {
                tracing::warn!(slave_id, error = %e, "modbus/discovered: failed to create device");
                continue;
            }
        };

        let coils    = entry["coils"].as_u64().unwrap_or(0) as u16;
        let discrete = entry["discrete_inputs"].as_u64().unwrap_or(0) as u16;
        let holding  = entry["holding_registers"].as_u64().unwrap_or(0) as u16;
        let input    = entry["input_registers"].as_u64().unwrap_or(0) as u16;

        tracing::info!(
            slave_id, baud_rate, device_id = %device.id,
            coils, discrete, holding, input,
            "modbus/discovered: device auto-registered"
        );

        log_devices.push(ScanLogDevice {
            slave_id,
            baud_rate: baud_rate as u64,
            coils,
            discrete_inputs: discrete,
            holding_registers: holding,
            input_registers: input,
            is_new: true,
            name: device.name.clone(),
        });

            auto_create_registers(modbus_repo, device.id, slave_id, coils, discrete, holding, input).await;

        registered += 1;
    }

    tracing::info!(
        found = discovered.len(),
        registered,
        "modbus/discovered: auto-registration complete",
    );

    let entry = ScanLogEntry {
        timestamp: Utc::now(),
        found: discovered.len(),
        registered,
        devices: log_devices,
    };
    if let Ok(mut log) = scan_log.lock() {
        log.push_front(entry);
        if log.len() > SCAN_LOG_CAPACITY {
            log.pop_back();
        }
    }
}

fn classify_device_name(slave_id: i64, coils: u16, discrete: u16, holding: u16, input: u16) -> String {
    let has_digital_out = coils > 0;
    let has_digital_in  = discrete > 0;
    let has_analog_out  = holding > 0;
    let has_analog_in   = input > 0;

    let kind = match (has_digital_out, has_digital_in, has_analog_out, has_analog_in) {
        (true,  false, false, false) => "Реле",
        (true,  true,  false, false) => "Реле с входами",
        (false, false, true,  false) => "Регулятор",
        (false, false, false, true)  => "Датчик",
        (false, false, true,  true)  => "Датчик",
        (true,  false, true,  false) => "Устройство управления",
        _                            => "Устройство Modbus",
    };

    format!("{} (slave {})", kind, slave_id)
}

async fn auto_create_registers(
    modbus_repo: &Arc<dyn ModbusRepository>,
    device_id: uuid::Uuid,
    slave_id: i64,
    coils: u16,
    discrete: u16,
    holding: u16,
    input: u16,
) {
    for i in 0..coils {
        let name = if coils == 1 {
            "Канал".to_string()
        } else {
            format!("Канал {}", i + 1)
        };
        if let Err(e) = modbus_repo
            .create_register(CreateModbusRegisterCmd {
                device_id,
                name,
                register_type: RegisterType::Coil,
                address: i as i64,
                count: 1,
                unit: None,
                scale_factor: 1.0,
                offset: 0.0,
                writable: true,
            })
            .await
        {
            tracing::warn!(slave_id, coil = i, error = %e, "modbus/discovered: failed to create coil register");
        }
    }

    for i in 0..discrete {
        let name = if discrete == 1 {
            "Вход".to_string()
        } else {
            format!("Вход {}", i + 1)
        };
        if let Err(e) = modbus_repo
            .create_register(CreateModbusRegisterCmd {
                device_id,
                name,
                register_type: RegisterType::Discrete,
                address: i as i64,
                count: 1,
                unit: None,
                scale_factor: 1.0,
                offset: 0.0,
                writable: false,
            })
            .await
        {
            tracing::warn!(slave_id, discrete = i, error = %e, "modbus/discovered: failed to create discrete register");
        }
    }

    if holding > 0 {
        if let Err(e) = modbus_repo
            .create_register(CreateModbusRegisterCmd {
                device_id,
                name: "Holding registers".to_string(),
                register_type: RegisterType::Holding,
                address: 0,
                count: holding as i64,
                unit: None,
                scale_factor: 1.0,
                offset: 0.0,
                writable: true,
            })
            .await
        {
            tracing::warn!(slave_id, error = %e, "modbus/discovered: failed to create holding register");
        }
    }

    if input > 0 {
        if let Err(e) = modbus_repo
            .create_register(CreateModbusRegisterCmd {
                device_id,
                name: "Измерения".to_string(),
                register_type: RegisterType::Input,
                address: 0,
                count: input as i64,
                unit: None,
                scale_factor: 1.0,
                offset: 0.0,
                writable: false,
            })
            .await
        {
            tracing::warn!(slave_id, error = %e, "modbus/discovered: failed to create input register");
        }
    }

    // If nothing was detected, fall back to 2 coil registers (most common case)
    if coils == 0 && discrete == 0 && holding == 0 && input == 0 {
        tracing::warn!(slave_id, "modbus/discovered: no capabilities detected, creating 2 default coil registers");
        for i in 0..2u16 {
            let _ = modbus_repo
                .create_register(CreateModbusRegisterCmd {
                    device_id,
                    name: format!("Канал {}", i + 1),
                    register_type: RegisterType::Coil,
                    address: i as i64,
                    count: 1,
                    unit: None,
                    scale_factor: 1.0,
                    offset: 0.0,
                    writable: true,
                })
                .await;
        }
    }
}