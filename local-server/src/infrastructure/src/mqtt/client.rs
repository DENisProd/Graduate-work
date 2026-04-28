use std::sync::Arc;
use std::time::Duration;

use async_trait::async_trait;
use rumqttc::{AsyncClient, Event, EventLoop, MqttOptions, Packet, QoS};
use tokio::sync::broadcast;

use local_server_application::ports::MqttClient;
use local_server_core::DomainError;

#[derive(Debug, Clone)]
pub struct MqttMessage {
    pub topic: String,
    pub payload: Vec<u8>,
}

pub struct RumqttcClient {
    inner: AsyncClient,
    prefix: String,
    msg_tx: broadcast::Sender<MqttMessage>,
}

impl RumqttcClient {
    /// Connect to the broker and start the event loop.
    /// Returns an Arc to the client and an initial message receiver.
    pub async fn connect(
        mqtt_url: &str,
        topic_prefix: &str,
    ) -> Result<Arc<Self>, anyhow::Error> {
        let (host, port) = parse_mqtt_url(mqtt_url)?;
        let client_id = format!("local-server-{}", uuid::Uuid::new_v4());

        let mut opts = MqttOptions::new(&client_id, &host, port);
        opts.set_keep_alive(Duration::from_secs(30));
        opts.set_clean_session(true);

        let (inner, eventloop) = AsyncClient::new(opts, 128);
        let (msg_tx, _) = broadcast::channel::<MqttMessage>(256);

        let client = Arc::new(Self { inner, prefix: topic_prefix.to_owned(), msg_tx });

        // Subscribe to all topics under the prefix
        let subscribe_topic = format!("{}/#", topic_prefix);
        client
            .inner
            .subscribe(&subscribe_topic, QoS::AtLeastOnce)
            .await
            .map_err(|e| anyhow::anyhow!("MQTT subscribe: {e}"))?;

        // Spawn the event loop driver in the background
        let tx = client.msg_tx.clone();
        let inner2 = client.inner.clone();
        tokio::spawn(run_eventloop(eventloop, tx, inner2, subscribe_topic));

        tracing::info!(host = %host, port, prefix = topic_prefix, "MQTT connected");
        Ok(client)
    }

    pub fn message_receiver(&self) -> broadcast::Receiver<MqttMessage> {
        self.msg_tx.subscribe()
    }

    pub fn topic_prefix(&self) -> &str {
        &self.prefix
    }
}

async fn run_eventloop(
    mut eventloop: EventLoop,
    tx: broadcast::Sender<MqttMessage>,
    client: AsyncClient,
    subscribe_topic: String,
) {
    let mut backoff = 1u64;
    loop {
        match eventloop.poll().await {
            Ok(Event::Incoming(Packet::ConnAck(_))) => {
                backoff = 1;
                tracing::info!("MQTT reconnected, re-subscribing");
                client.subscribe(&subscribe_topic, QoS::AtLeastOnce).await.ok();
            }
            Ok(Event::Incoming(Packet::Publish(p))) => {
                let msg = MqttMessage { topic: p.topic.clone(), payload: p.payload.to_vec() };
                tx.send(msg).ok();
            }
            Ok(_) => {}
            Err(e) => {
                tracing::warn!(error = %e, backoff_secs = backoff, "MQTT error, will retry");
                tokio::time::sleep(Duration::from_secs(backoff)).await;
                backoff = (backoff * 2).min(60);
            }
        }
    }
}

#[async_trait]
impl MqttClient for RumqttcClient {
    async fn publish(&self, topic: &str, payload: &[u8]) -> Result<(), DomainError> {
        self.inner
            .publish(topic, QoS::AtLeastOnce, false, payload)
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("MQTT publish: {e}")))
    }
}

fn parse_mqtt_url(url: &str) -> Result<(String, u16), anyhow::Error> {
    let stripped = url
        .strip_prefix("mqtts://")
        .or_else(|| url.strip_prefix("mqtt://"))
        .unwrap_or(url);
    // strip any trailing path
    let host_port = stripped.split('/').next().unwrap_or(stripped);
    let (host, port_str) = host_port
        .split_once(':')
        .unwrap_or((host_port, "1883"));
    let port: u16 = port_str.parse().unwrap_or(1883);
    Ok((host.to_owned(), port))
}
