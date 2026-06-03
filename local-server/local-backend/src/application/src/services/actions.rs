use std::time::Duration;

use local_server_core::{
    DomainError,
    entities::scenario::{Action, HttpMethod, NotifyChannel},
};
use uuid::Uuid;

use super::exec_context::ExecContext;

pub async fn exec_action(action: &Action, ctx: &ExecContext) -> Result<(), DomainError> {
    match action {
        Action::DeviceCommand { device_id, command, args } => {
            exec_device_command(ctx, device_id, command, args.as_ref()).await?;
        }

        Action::Delay { ms } => {
            tokio::time::sleep(Duration::from_millis(*ms)).await;
        }

        Action::HttpRequest { method, url, headers, body, timeout_ms } => {
            exec_http_request(method, url, headers.as_ref(), body.as_ref(), *timeout_ms).await?;
        }

        Action::Notify { channel, title, message } => {
            exec_notify(channel, title.as_deref(), message);
        }
    }
    Ok(())
}

async fn exec_device_command(
    ctx: &ExecContext,
    device_id: &str,
    command: &str,
    args: Option<&serde_json::Value>,
) -> Result<(), DomainError> {
    let mqtt = ctx
        .mqtt
        .as_ref()
        .ok_or_else(|| DomainError::DependencyUnavailable("MQTT not connected".to_string()))?;

    let uuid = Uuid::parse_str(device_id)
        .map_err(|_| DomainError::Validation(format!("invalid device_id UUID: {device_id}")))?;

    let device = ctx
        .phys_repo
        .find_by_id(uuid)
        .await?
        .ok_or_else(|| DomainError::not_found("physical_device", device_id))?;

    let friendly_name = device
        .friendly_name
        .ok_or_else(|| DomainError::Internal("device has no friendly_name".to_string()))?;

    let topic = format!("{}/{}/set", ctx.mqtt_prefix, friendly_name);

    let mut payload = args.cloned().unwrap_or_else(|| serde_json::json!({}));
    if let serde_json::Value::Object(ref mut map) = payload {
        map.insert(command.to_string(), serde_json::Value::Bool(true));
    }

    mqtt.publish(&topic, payload.to_string().as_bytes()).await
}

async fn exec_http_request(
    method: &HttpMethod,
    url: &str,
    headers: Option<&serde_json::Value>,
    body: Option<&serde_json::Value>,
    timeout_ms: Option<u64>,
) -> Result<(), DomainError> {
    let client = reqwest::Client::new();
    let timeout = Duration::from_millis(timeout_ms.unwrap_or(10_000));

    let mut builder = match method {
        HttpMethod::Get => client.get(url),
        HttpMethod::Post => client.post(url),
        HttpMethod::Put => client.put(url),
        HttpMethod::Patch => client.patch(url),
        HttpMethod::Delete => client.delete(url),
    };

    builder = builder.timeout(timeout);

    if let Some(serde_json::Value::Object(map)) = headers {
        for (k, v) in map {
            if let Some(v_str) = v.as_str() {
                builder = builder.header(k.as_str(), v_str);
            }
        }
    }

    if let Some(b) = body {
        builder = builder.json(b);
    }

    builder
        .send()
        .await
        .map_err(|e| DomainError::Internal(format!("HTTP request failed: {e}")))?;

    Ok(())
}

fn exec_notify(channel: &NotifyChannel, title: Option<&str>, message: &str) {
    match channel {
        NotifyChannel::Log | NotifyChannel::Push => {
            tracing::info!(channel = ?channel, title, message, "scenario notification");
        }
    }
}