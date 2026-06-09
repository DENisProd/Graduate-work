use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use async_trait::async_trait;
use rumqttc::{AsyncClient, ConnectReturnCode, Event, EventLoop, MqttOptions, Packet, QoS, Transport};
use tokio::sync::{broadcast, oneshot, watch};

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
    broker_url: String,
    msg_tx: broadcast::Sender<MqttMessage>,
    shutdown_tx: watch::Sender<bool>,
    connected: AtomicBool,
}

impl RumqttcClient {
    pub async fn connect(
        mqtt_url: &str,
        subscribe_topics: &[String],
        username: Option<&str>,
        password: Option<&str>,
    ) -> Result<Arc<Self>, anyhow::Error> {
        let (host, port, transport) = parse_mqtt_url(mqtt_url)?;
        let client_id = format!("local-server-{}", uuid::Uuid::new_v4());

        let mut opts = MqttOptions::new(&client_id, &host, port);
        opts.set_keep_alive(Duration::from_secs(30));
        opts.set_clean_session(true);
        opts.set_max_packet_size(256 * 1024, 256 * 1024);
        if username.is_some() || password.is_some() {
            opts.set_credentials(
                username.unwrap_or_default(),
                password.unwrap_or_default(),
            );
        }
        if let Some(t) = transport {
            opts.set_transport(t);
        }

        let (inner, eventloop) = AsyncClient::new(opts, 128);
        let (msg_tx, _) = broadcast::channel::<MqttMessage>(256);
        let (shutdown_tx, shutdown_rx) = watch::channel(false);
        let (connack_tx, connack_rx) = oneshot::channel();

        let prefix = subscribe_topics
            .first()
            .and_then(|t| t.strip_suffix("/#"))
            .unwrap_or("zigbee2mqtt")
            .to_string();

        let client = Arc::new(Self {
            inner,
            prefix,
            broker_url: mqtt_url.to_string(),
            msg_tx,
            shutdown_tx,
            connected: AtomicBool::new(false),
        });

        let tx = client.msg_tx.clone();
        let inner2 = client.inner.clone();
        let subscribe_topics_owned: Vec<String> = subscribe_topics.to_vec();
        let connected_flag = Arc::new(AtomicBool::new(false));
        let connected_for_loop = connected_flag.clone();
        tokio::spawn(run_eventloop(
            eventloop,
            tx,
            inner2,
            subscribe_topics_owned,
            shutdown_rx,
            mqtt_url.to_owned(),
            Some(connack_tx),
            connected_for_loop,
        ));

        match tokio::time::timeout(Duration::from_secs(15), connack_rx).await {
            Ok(Ok(Ok(()))) => {
                client.connected.store(true, Ordering::SeqCst);
            }
            Ok(Ok(Err(e))) => {
                client.shutdown();
                return Err(e);
            }
            Ok(Err(_)) => {
                client.shutdown();
                return Err(anyhow::anyhow!("MQTT connection closed before ConnAck"));
            }
            Err(_) => {
                client.shutdown();
                return Err(anyhow::anyhow!(
                    "MQTT connection timed out waiting for broker acknowledgement"
                ));
            }
        }

        for topic in subscribe_topics {
            client
                .inner
                .subscribe(topic, QoS::AtLeastOnce)
                .await
                .map_err(|e| anyhow::anyhow!("MQTT subscribe {topic}: {e}"))?;
        }

        tracing::info!(host = %host, port, topics = subscribe_topics.len(), "MQTT connected");
        Ok(client)
    }

    pub fn message_receiver(&self) -> broadcast::Receiver<MqttMessage> {
        self.msg_tx.subscribe()
    }

    pub fn topic_prefix(&self) -> &str {
        &self.prefix
    }

    pub fn is_broker_connected(&self) -> bool {
        self.connected.load(Ordering::SeqCst)
    }

    pub fn shutdown(&self) {
        self.connected.store(false, Ordering::SeqCst);
        let _ = self.shutdown_tx.send(true);
    }
}

async fn run_eventloop(
    mut eventloop: EventLoop,
    tx: broadcast::Sender<MqttMessage>,
    client: AsyncClient,
    subscribe_topics: Vec<String>,
    mut shutdown_rx: watch::Receiver<bool>,
    broker_url: String,
    mut connack_tx: Option<oneshot::Sender<Result<(), anyhow::Error>>>,
    connected: Arc<AtomicBool>,
) {
    let mut backoff = 1u64;
    loop {
        tokio::select! {
            _ = shutdown_rx.changed() => {
                if *shutdown_rx.borrow() {
                    tracing::info!("MQTT event loop shutdown requested");
                    connected.store(false, Ordering::SeqCst);
                    break;
                }
            }
            ev = eventloop.poll() => match ev {
            Ok(Event::Incoming(Packet::ConnAck(ack))) => {
                backoff = 1;
                if ack.code == ConnectReturnCode::Success {
                    connected.store(true, Ordering::SeqCst);
                    if let Some(tx) = connack_tx.take() {
                        let _ = tx.send(Ok(()));
                    }
                    tracing::info!(broker = %broker_url, "MQTT reconnected, re-subscribing");
                    for topic in &subscribe_topics {
                        client.subscribe(topic, QoS::AtLeastOnce).await.ok();
                    }
                } else {
                    connected.store(false, Ordering::SeqCst);
                    let err = anyhow::anyhow!("MQTT broker rejected connection: {:?}", ack.code);
                    if let Some(tx) = connack_tx.take() {
                        let _ = tx.send(Err(err));
                    }
                    tracing::warn!(broker = %broker_url, code = ?ack.code, "MQTT auth/connect rejected");
                }
            }
            Ok(Event::Incoming(Packet::Publish(p))) => {
                let msg = MqttMessage { topic: p.topic.clone(), payload: p.payload.to_vec() };
                tx.send(msg).ok();
            }
            Ok(_) => {}
            Err(e) => {
                connected.store(false, Ordering::SeqCst);
                let err_msg = e.to_string();
                if let Some(tx) = connack_tx.take() {
                    let _ = tx.send(Err(anyhow::anyhow!("{err_msg}")));
                }
                tracing::warn!(broker = %broker_url, error = %e, backoff_secs = backoff, "MQTT error, will retry");
                tokio::time::sleep(Duration::from_secs(backoff)).await;
                backoff = (backoff * 2).min(60);
            }
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

    async fn is_connected(&self) -> bool {
        self.is_broker_connected()
    }

    async fn current_url(&self) -> Option<String> {
        Some(self.broker_url.clone())
    }

    async fn is_cloud_connected(&self) -> bool {
        false
    }

    async fn cloud_current_url(&self) -> Option<String> {
        None
    }

    async fn reconfigure(
        &self,
        _config: local_server_application::ports::MqttRuntimeConfig,
    ) -> Result<(), DomainError> {
        Err(DomainError::Validation(
            "static MQTT client does not support runtime reconfiguration".into(),
        ))
    }
}

fn parse_mqtt_url(url: &str) -> Result<(String, u16, Option<Transport>), anyhow::Error> {
    if url.starts_with("ws://") || url.starts_with("wss://") {
        let is_tls = url.starts_with("wss://");
        let stripped = url
            .strip_prefix("wss://")
            .or_else(|| url.strip_prefix("ws://"))
            .unwrap_or(url);
        let host_port = stripped.split('/').next().unwrap_or(stripped);
        let default_port = if is_tls { 443 } else { 80 };
        let (_, port_str) = host_port.split_once(':').unwrap_or((host_port, ""));
        let port: u16 = if port_str.is_empty() {
            default_port
        } else {
            port_str.parse().unwrap_or(default_port)
        };
        let transport = if is_tls {
            Transport::Wss(Default::default())
        } else {
            Transport::Ws
        };
        return Ok((url.to_owned(), port, Some(transport)));
    }

    let stripped = url
        .strip_prefix("mqtts://")
        .or_else(|| url.strip_prefix("mqtt://"))
        .unwrap_or(url);
    let host_port = stripped.split('/').next().unwrap_or(stripped);
    let (host, port_str) = host_port
        .split_once(':')
        .unwrap_or((host_port, "1883"));
    let port: u16 = port_str.parse().unwrap_or(1883);
    Ok((host.to_owned(), port, None))
}
