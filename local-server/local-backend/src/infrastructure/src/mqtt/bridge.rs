use std::sync::Arc;

use local_server_application::ports::MqttClient;
use local_server_core::mqtt_topics::{parse_house_id, telemetry_topic};
use tokio::sync::broadcast;

use super::client::{MqttMessage, RumqttcClient};

/// Forward local Zigbee/Modbus telemetry to cloud `houses/{id}/zigbee2mqtt/...`.
pub fn map_local_to_cloud(house_id: &str, prefix: &str, topic: &str) -> Option<String> {
    if topic == "modbus/response" || topic == "modbus/discovered" || topic == "modbus/status" {
        return Some(format!("houses/{house_id}/{topic}"));
    }
    let suffix = topic.strip_prefix(prefix)?.trim_start_matches('/');
    if suffix.is_empty() {
        return None;
    }
    Some(telemetry_topic(house_id, suffix))
}

/// Forward cloud commands `houses/{id}/cmd/zigbee2mqtt/...` to local `zigbee2mqtt/...`.
pub fn map_cloud_to_local(prefix: &str, topic: &str) -> Option<String> {
    let house_id = parse_house_id(topic)?;
    let rest = topic.strip_prefix(&format!("houses/{house_id}/"))?;
    let cmd_marker = format!("cmd/{prefix}/");
    let suffix = rest.strip_prefix(&cmd_marker)?;
    if suffix.is_empty() {
        return None;
    }
    Some(format!("{prefix}/{suffix}"))
}

pub async fn run_mqtt_bridge(
    mut local_rx: broadcast::Receiver<MqttMessage>,
    mut cloud_rx: broadcast::Receiver<MqttMessage>,
    local_client: Arc<RumqttcClient>,
    cloud_client: Arc<RumqttcClient>,
    house_id: String,
    prefix: String,
) {
    tracing::info!(house_id = %house_id, prefix = %prefix, "MQTT house bridge started");
    loop {
        tokio::select! {
            msg = local_rx.recv() => match msg {
                Ok(m) => {
                    if let Some(cloud_topic) = map_local_to_cloud(&house_id, &prefix, &m.topic) {
                        if let Err(e) = cloud_client.publish(&cloud_topic, &m.payload).await {
                            tracing::debug!(error = %e, topic = %cloud_topic, "bridge: local→cloud publish failed");
                        }
                    }
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!(dropped = n, "bridge: local MQTT lagged");
                }
                Err(broadcast::error::RecvError::Closed) => break,
            },
            msg = cloud_rx.recv() => match msg {
                Ok(m) => {
                    if let Some(local_topic) = map_cloud_to_local(&prefix, &m.topic) {
                        if let Err(e) = local_client.publish(&local_topic, &m.payload).await {
                            tracing::debug!(error = %e, topic = %local_topic, "bridge: cloud→local publish failed");
                        }
                    }
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!(dropped = n, "bridge: cloud MQTT lagged");
                }
                Err(broadcast::error::RecvError::Closed) => break,
            },
        }
    }
    tracing::info!("MQTT house bridge stopped");
}
