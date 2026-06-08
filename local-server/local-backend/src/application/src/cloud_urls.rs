use crate::ports::{AccessSyncRepository, MqttConnectConfig, MqttRuntimeConfig, RuntimeSettings};

const DEFAULT_LOCAL_MQTT: &str = "mqtt://mosquitto:1883";

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

pub fn resolve_local_mqtt_connect_config(
    configured_url: Option<&str>,
    default_username: Option<&str>,
    default_password: Option<&str>,
) -> Option<MqttConnectConfig> {
    let url = configured_url
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| DEFAULT_LOCAL_MQTT.to_string());
    let (username, password) =
        resolve_mqtt_credentials(&RuntimeSettings::default(), default_username, default_password);
    Some(MqttConnectConfig {
        url,
        username,
        password,
    })
}

pub fn resolve_cloud_mqtt_connect_config(
    gateway_url: &str,
    settings: &RuntimeSettings,
    default_username: Option<&str>,
    default_password: Option<&str>,
) -> Option<MqttConnectConfig> {
    let url = mqtt_ws_url_from_gateway(gateway_url)?;
    let (username, password) =
        resolve_mqtt_credentials(settings, default_username, default_password);
    Some(MqttConnectConfig {
        url,
        username,
        password,
    })
}

pub fn resolve_mqtt_runtime_config(
    configured_local_url: Option<&str>,
    gateway_url: &str,
    settings: &RuntimeSettings,
    default_username: Option<&str>,
    default_password: Option<&str>,
    bridge_house_id: Option<String>,
) -> MqttRuntimeConfig {
    MqttRuntimeConfig {
        local: resolve_local_mqtt_connect_config(
            configured_local_url,
            default_username,
            default_password,
        ),
        cloud: resolve_cloud_mqtt_connect_config(
            gateway_url,
            settings,
            default_username,
            default_password,
        ),
        bridge_house_id,
    }
}

/// House id for local↔cloud MQTT bridging: explicit env/config, else first synced house.
pub async fn resolve_bridge_house_id(
    access_sync: &dyn AccessSyncRepository,
    settings: &RuntimeSettings,
    configured: Option<&str>,
) -> Option<String> {
    if let Some(id) = configured.map(str::trim).filter(|s| !s.is_empty()) {
        return Some(id.to_string());
    }
    let user_id = settings.auth_external_user_id.as_deref()?;
    access_sync
        .list_houses(user_id)
        .await
        .ok()?
        .first()
        .map(|h| h.id.clone())
}

/// Legacy single-broker resolver (local preferred, else cloud gateway).
pub fn resolve_mqtt_connect_config(
    configured_url: Option<&str>,
    gateway_url: &str,
    settings: &RuntimeSettings,
    default_username: Option<&str>,
    default_password: Option<&str>,
) -> Option<MqttConnectConfig> {
    resolve_local_mqtt_connect_config(configured_url, default_username, default_password).or_else(
        || resolve_cloud_mqtt_connect_config(gateway_url, settings, default_username, default_password),
    )
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
    use crate::ports::RuntimeSettings;

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

    #[test]
    fn local_mqtt_ignores_cloud_sqlite_credentials() {
        let settings = RuntimeSettings {
            mqtt_username: Some("cloud-user".into()),
            mqtt_password: Some("cloud-pass".into()),
            ..Default::default()
        };
        let cfg = resolve_local_mqtt_connect_config(Some("mqtt://mosquitto:1883"), None, None).unwrap();
        assert_eq!(cfg.url, "mqtt://mosquitto:1883");
        assert!(cfg.username.is_none());
        assert!(cfg.password.is_none());
        let _ = settings;
    }

    #[test]
    fn gateway_mqtt_uses_sqlite_credentials() {
        let settings = RuntimeSettings {
            mqtt_username: Some("cloud-user".into()),
            mqtt_password: Some("cloud-pass".into()),
            ..Default::default()
        };
        let cfg = resolve_cloud_mqtt_connect_config("https://api-home.example", &settings, None, None)
            .unwrap();
        assert_eq!(cfg.url, "wss://api-home.example/api/mqtt");
        assert_eq!(cfg.username.as_deref(), Some("cloud-user"));
        assert_eq!(cfg.password.as_deref(), Some("cloud-pass"));
    }

    #[test]
    fn runtime_config_includes_both_brokers() {
        let settings = RuntimeSettings {
            mqtt_username: Some("cloud-user".into()),
            ..Default::default()
        };
        let cfg = resolve_mqtt_runtime_config(
            Some("mqtt://mosquitto:1883"),
            "https://api-home.example",
            &settings,
            None,
            None,
            Some("house-1".into()),
        );
        assert_eq!(cfg.local.as_ref().unwrap().url, "mqtt://mosquitto:1883");
        assert!(cfg.cloud.is_some());
        assert_eq!(cfg.bridge_house_id.as_deref(), Some("house-1"));
    }
}
