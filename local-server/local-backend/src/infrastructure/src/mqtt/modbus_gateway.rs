use std::sync::Arc;
use std::time::Duration;

use async_trait::async_trait;
use dashmap::DashMap;
use local_server_application::ports::{ModbusBridgePort, MqttClient};
use local_server_core::DomainError;
use serde_json::Value;
use tokio::sync::oneshot;
use uuid::Uuid;

/// Sends Modbus RTU commands through the MQTT bridge (topic `modbus/command`)
/// and correlates responses from `modbus/response` using a UUID `request_id`.
pub struct ModbusGateway {
    pending: DashMap<String, oneshot::Sender<Value>>,
    command_topic: String,
    response_timeout: Duration,
}

impl ModbusGateway {
    pub fn new() -> Self {
        Self {
            pending: DashMap::new(),
            command_topic: "modbus/command".to_string(),
            response_timeout: Duration::from_secs(5),
        }
    }

    /// Send a command JSON, inject a `request_id`, wait for the matching response.
    ///
    /// The caller should set `slave_id`, `address`, etc. in `cmd`.
    /// `action` must be one of the values accepted by the Rust modbus-mqtt-bridge.
    pub async fn execute(
        &self,
        mqtt: &dyn MqttClient,
        mut cmd: Value,
    ) -> Result<Value, DomainError> {
        let request_id = Uuid::new_v4().to_string();
        cmd["request_id"] = Value::String(request_id.clone());

        let action = cmd.get("action").and_then(|v| v.as_str()).unwrap_or("?").to_string();
        let slave_id = cmd.get("slave_id").and_then(|v| v.as_i64()).unwrap_or(-1);
        let address = cmd.get("address").and_then(|v| v.as_i64()).unwrap_or(-1);

        tracing::info!(
            request_id = %request_id,
            action = %action,
            slave_id = slave_id,
            address = address,
            topic = %self.command_topic,
            "modbus: sending command",
        );

        let (tx, rx) = oneshot::channel::<Value>();
        self.pending.insert(request_id.clone(), tx);

        let payload = serde_json::to_vec(&cmd)
            .map_err(|e| DomainError::Internal(format!("serialize: {e}")))?;

        if let Err(e) = mqtt.publish(&self.command_topic, &payload).await {
            self.pending.remove(&request_id);
            tracing::error!(
                request_id = %request_id,
                error = %e,
                "modbus: failed to publish command to MQTT",
            );
            return Err(e);
        }

        tracing::info!(
            request_id = %request_id,
            timeout_secs = self.response_timeout.as_secs(),
            "modbus: command published, waiting for response",
        );

        match tokio::time::timeout(self.response_timeout, rx).await {
            Ok(Ok(rsp)) => {
                if rsp.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
                    tracing::info!(
                        request_id = %request_id,
                        action = %action,
                        "modbus: response received OK",
                    );
                    Ok(rsp.get("data").cloned().unwrap_or(Value::Null))
                } else {
                    let msg = rsp
                        .get("error")
                        .and_then(|v| v.as_str())
                        .unwrap_or("modbus error")
                        .to_string();
                    tracing::warn!(
                        request_id = %request_id,
                        action = %action,
                        slave_id = slave_id,
                        address = address,
                        error = %msg,
                        "modbus: bridge returned error response",
                    );
                    Err(DomainError::DependencyUnavailable(msg))
                }
            }
            Ok(Err(_)) => {
                tracing::error!(request_id = %request_id, "modbus: response channel dropped");
                Err(DomainError::Internal("response channel dropped".into()))
            }
            Err(_) => {
                self.pending.remove(&request_id);
                tracing::error!(
                    request_id = %request_id,
                    action = %action,
                    slave_id = slave_id,
                    address = address,
                    timeout_secs = self.response_timeout.as_secs(),
                    "modbus: bridge timeout — no response on modbus/response topic",
                );
                Err(DomainError::DependencyUnavailable(
                    "Modbus bridge did not respond within timeout".into(),
                ))
            }
        }
    }

    /// Called from the MQTT ingest loop when a `modbus/response` message arrives.
    pub fn on_response(&self, payload: &[u8]) {
        let Ok(rsp) = serde_json::from_slice::<Value>(payload) else {
            tracing::warn!("modbus: received non-JSON payload on modbus/response");
            return;
        };
        let Some(id) = rsp.get("request_id").and_then(|v| v.as_str()) else {
            tracing::warn!(payload = ?rsp, "modbus: response missing request_id field");
            return;
        };
        tracing::debug!(request_id = %id, "modbus: response arrived on modbus/response");
        if let Some((_, tx)) = self.pending.remove(id) {
            tx.send(rsp).ok();
        } else {
            tracing::warn!(
                request_id = %id,
                "modbus: response arrived for unknown/expired request_id (already timed out?)",
            );
        }
    }
}

impl Default for ModbusGateway {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ModbusBridgePort for ModbusGateway {
    async fn execute(
        &self,
        mqtt: Arc<dyn MqttClient>,
        cmd: Value,
    ) -> Result<Value, DomainError> {
        ModbusGateway::execute(self, mqtt.as_ref(), cmd).await
    }
}
