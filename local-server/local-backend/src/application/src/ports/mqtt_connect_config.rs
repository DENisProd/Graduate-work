#[derive(Debug, Clone)]
pub struct MqttConnectConfig {
    pub url: String,
    pub username: Option<String>,
    pub password: Option<String>,
}

/// Local Mosquitto + optional cloud gateway MQTT with house-scoped bridging.
#[derive(Debug, Clone, Default)]
pub struct MqttRuntimeConfig {
    pub local: Option<MqttConnectConfig>,
    pub cloud: Option<MqttConnectConfig>,
    pub bridge_house_id: Option<String>,
}
