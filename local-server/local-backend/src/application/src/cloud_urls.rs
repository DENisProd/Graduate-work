use crate::ports::{MqttConnectConfig, RuntimeSettings};

pub fn scenario_url_from_access(access: &str) -> String {
    let base = access.trim().trim_end_matches('/');
    let origin = base
        .strip_suffix("/api/access")
        .unwrap_or(base)
        .trim_end_matches('/');
    format!("{origin}/api/scenario")
}

/// WebSocket MQTT URL for cloud broker via api-gateway (`/api/mqtt` → EMQX `/mqtt`).
pub fn mqtt_ws_url_from_gateway(gateway_url: &str) -> Option<String> {
    let base = gateway_url.trim().trim_end_matches('/');
    if base.starts_with("https://") {
        Some(format!(
            "{}/api/mqtt",
            base.replacen("https://", "wss://", 1)
        ))
    } else if base.starts_with("http://") {
        Some(format!("{}/api/mqtt", base.replacen("http://", "ws://", 1)))
    } else {
        None
    }
}

pub fn resolve_mqtt_credentials(
    settings: &RuntimeSettings,
    default_username: Option<&str>,
    default_password: Option<&str>,
) -> (Option<String>, Option<String>) {
    let username = settings
        .mqtt_username
        .clone()
        .or_else(|| {
            default_username
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(str::to_string)
        });
    let password = settings
        .mqtt_password
        .clone()
        .or_else(|| {
            default_password
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(str::to_string)
        });
    (username, password)
}

pub fn resolve_mqtt_connect_config(
    configured_url: Option<&str>,
    gateway_url: &str,
    settings: &RuntimeSettings,
    default_username: Option<&str>,
    default_password: Option<&str>,
) -> Option<MqttConnectConfig> {
    let url = resolve_mqtt_url(configured_url, gateway_url)?;
    let (username, password) =
        resolve_mqtt_credentials(settings, default_username, default_password);
    Some(MqttConnectConfig {
        url,
        username,
        password,
    })
}

pub fn resolve_mqtt_url(configured: Option<&str>, gateway_url: &str) -> Option<String> {
    configured
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .or_else(|| mqtt_ws_url_from_gateway(gateway_url))
}

pub fn resolve_scenario_service_url(
    runtime_access: Option<&str>,
    cloud_sync_fallback: &str,
    scenario_fallback: &str,
) -> String {
    let access = runtime_access
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| cloud_sync_fallback.trim());
    if access.is_empty() {
        return scenario_fallback.trim().to_string();
    }
    scenario_url_from_access(access)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mqtt_ws_url_from_http_gateway() {
        assert_eq!(
            mqtt_ws_url_from_gateway("http://localhost:8082").as_deref(),
            Some("ws://localhost:8082/api/mqtt")
        );
    }

    #[test]
    fn resolve_mqtt_prefers_configured() {
        assert_eq!(
            resolve_mqtt_url(Some("mqtt://mosquitto:1883"), "http://localhost:8082").as_deref(),
            Some("mqtt://mosquitto:1883")
        );
    }

    #[test]
    fn resolve_mqtt_derives_from_gateway() {
        assert_eq!(
            resolve_mqtt_url(None, "http://host.docker.internal:8082").as_deref(),
            Some("ws://host.docker.internal:8082/api/mqtt")
        );
    }
}
