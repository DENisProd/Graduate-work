#[derive(Debug, Clone)]
pub struct MqttConnectConfig {
    pub url: String,
    pub username: Option<String>,
    pub password: Option<String>,
}
