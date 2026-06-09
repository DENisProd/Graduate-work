use std::sync::Arc;

use async_trait::async_trait;
use local_server_application::{
    ports::{MqttClient, MqttConnectConfig, MqttRuntimeConfig, ModbusRepository, PhysicalDeviceRepository, ZigbeeRepository},
    services::ZigbeeRealtimeService,
    DomainError,
};
use local_server_core::{entities::scan_log::ScanLog, mqtt_topics::telemetry_wildcard};
use local_server_infrastructure::{run_ingestion, run_mqtt_bridge, ModbusGateway, RumqttcClient};
use tokio::sync::{Mutex, RwLock};

pub struct RuntimeMqttManager {
    topic_prefix: String,
    zigbee_repo: Arc<dyn ZigbeeRepository>,
    phys_repo: Arc<dyn PhysicalDeviceRepository>,
    realtime_svc: Arc<ZigbeeRealtimeService>,
    modbus_gateway: Arc<ModbusGateway>,
    modbus_repo: Arc<dyn ModbusRepository>,
    scan_log: ScanLog,
    local_url: RwLock<Option<String>>,
    cloud_url: RwLock<Option<String>>,
    local_client: RwLock<Option<Arc<RumqttcClient>>>,
    cloud_client: RwLock<Option<Arc<RumqttcClient>>>,
    ingestion_task: Mutex<Option<tokio::task::JoinHandle<()>>>,
    bridge_task: Mutex<Option<tokio::task::JoinHandle<()>>>,
    reconnect_lock: Mutex<()>,
}

impl RuntimeMqttManager {
    pub fn new(
        topic_prefix: String,
        zigbee_repo: Arc<dyn ZigbeeRepository>,
        phys_repo: Arc<dyn PhysicalDeviceRepository>,
        realtime_svc: Arc<ZigbeeRealtimeService>,
        modbus_gateway: Arc<ModbusGateway>,
        modbus_repo: Arc<dyn ModbusRepository>,
        scan_log: ScanLog,
    ) -> Self {
        Self {
            topic_prefix,
            zigbee_repo,
            phys_repo,
            realtime_svc,
            modbus_gateway,
            modbus_repo,
            scan_log,
            local_url: RwLock::new(None),
            cloud_url: RwLock::new(None),
            local_client: RwLock::new(None),
            cloud_client: RwLock::new(None),
            ingestion_task: Mutex::new(None),
            bridge_task: Mutex::new(None),
            reconnect_lock: Mutex::new(()),
        }
    }

    pub async fn reconfigure(&self, config: MqttRuntimeConfig) -> Result<(), DomainError> {
        let _guard = self.reconnect_lock.lock().await;
        self.shutdown_bridge().await;
        self.shutdown_ingestion().await;
        self.shutdown_cloud().await;
        self.shutdown_local().await;

        if let Some(local) = config.local.filter(|c| !c.url.trim().is_empty()) {
            self.connect_local(&local).await?;
        }

        if let Some(cloud) = config.cloud.filter(|c| !c.url.trim().is_empty()) {
            if let Some(house_id) = config
                .bridge_house_id
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
            {
                self.connect_cloud(&cloud, house_id).await?;
                self.start_bridge(house_id.to_string()).await?;
            } else {
                tracing::warn!(
                    "cloud MQTT configured but bridge_house_id is missing — cloud ingest/bridge disabled"
                );
            }
        }

        Ok(())
    }

    async fn connect_local(&self, config: &MqttConnectConfig) -> Result<(), DomainError> {
        let mqtt_url = config.url.trim();
        let subs = vec![
            format!("{}/#", self.topic_prefix),
            "modbus/response".to_string(),
            "modbus/discovered".to_string(),
        ];
        let new_client = RumqttcClient::connect(
            mqtt_url,
            &subs,
            config.username.as_deref(),
            config.password.as_deref(),
        )
        .await
        .map_err(|e| DomainError::DependencyUnavailable(format!("local MQTT connect: {e}")))?;

        let rx = new_client.message_receiver();
        let new_task = tokio::spawn(run_ingestion(
            rx,
            self.zigbee_repo.clone(),
            self.phys_repo.clone(),
            self.realtime_svc.clone(),
            self.topic_prefix.clone(),
            Some(self.modbus_gateway.clone()),
            self.modbus_repo.clone(),
            self.scan_log.clone(),
        ));

        *self.ingestion_task.lock().await = Some(new_task);
        *self.local_client.write().await = Some(new_client);
        *self.local_url.write().await = Some(mqtt_url.to_string());
        tracing::info!(url = mqtt_url, "local MQTT connected");
        Ok(())
    }

    async fn connect_cloud(&self, config: &MqttConnectConfig, house_id: &str) -> Result<(), DomainError> {
        let mqtt_url = config.url.trim();
        let cmd_wildcard = format!("houses/{house_id}/cmd/{}/#", self.topic_prefix);
        let subs = vec![telemetry_wildcard(house_id), cmd_wildcard];
        let new_client = RumqttcClient::connect(
            mqtt_url,
            &subs,
            config.username.as_deref(),
            config.password.as_deref(),
        )
        .await
        .map_err(|e| DomainError::DependencyUnavailable(format!("cloud MQTT connect: {e}")))?;

        *self.cloud_client.write().await = Some(new_client);
        *self.cloud_url.write().await = Some(mqtt_url.to_string());
        tracing::info!(url = mqtt_url, house_id, "cloud MQTT connected");
        Ok(())
    }

    async fn start_bridge(&self, house_id: String) -> Result<(), DomainError> {
        let local = self
            .local_client
            .read()
            .await
            .clone()
            .ok_or_else(|| DomainError::DependencyUnavailable("local MQTT not connected".into()))?;
        let cloud = self
            .cloud_client
            .read()
            .await
            .clone()
            .ok_or_else(|| DomainError::DependencyUnavailable("cloud MQTT not connected".into()))?;

        let local_rx = local.message_receiver();
        let cloud_rx = cloud.message_receiver();
        let prefix = self.topic_prefix.clone();
        let task = tokio::spawn(run_mqtt_bridge(
            local_rx,
            cloud_rx,
            local,
            cloud,
            house_id,
            prefix,
        ));
        *self.bridge_task.lock().await = Some(task);
        Ok(())
    }

    async fn shutdown_bridge(&self) {
        if let Some(task) = self.bridge_task.lock().await.take() {
            task.abort();
        }
    }

    async fn shutdown_ingestion(&self) {
        if let Some(task) = self.ingestion_task.lock().await.take() {
            task.abort();
        }
    }

    async fn shutdown_local(&self) {
        if let Some(client) = self.local_client.write().await.take() {
            client.shutdown();
        }
        *self.local_url.write().await = None;
    }

    async fn shutdown_cloud(&self) {
        if let Some(client) = self.cloud_client.write().await.take() {
            client.shutdown();
        }
        *self.cloud_url.write().await = None;
    }

    pub async fn is_connected(&self) -> bool {
        if let Some(client) = self.local_client.read().await.as_ref() {
            return client.is_broker_connected();
        }
        false
    }

    pub async fn is_cloud_connected(&self) -> bool {
        if let Some(client) = self.cloud_client.read().await.as_ref() {
            return client.is_broker_connected();
        }
        false
    }

    pub async fn current_url(&self) -> Option<String> {
        self.local_url.read().await.clone()
    }

    pub async fn cloud_current_url(&self) -> Option<String> {
        self.cloud_url.read().await.clone()
    }
}

#[async_trait]
impl MqttClient for RuntimeMqttManager {
    async fn publish(&self, topic: &str, payload: &[u8]) -> Result<(), DomainError> {
        let client = self.local_client.read().await.clone();
        match client {
            Some(c) => c.publish(topic, payload).await,
            None => Err(DomainError::DependencyUnavailable("local MQTT not configured".into())),
        }
    }

    async fn is_connected(&self) -> bool {
        RuntimeMqttManager::is_connected(self).await
    }

    async fn current_url(&self) -> Option<String> {
        RuntimeMqttManager::current_url(self).await
    }

    async fn is_cloud_connected(&self) -> bool {
        RuntimeMqttManager::is_cloud_connected(self).await
    }

    async fn cloud_current_url(&self) -> Option<String> {
        RuntimeMqttManager::cloud_current_url(self).await
    }

    async fn reconfigure(&self, config: MqttRuntimeConfig) -> Result<(), DomainError> {
        RuntimeMqttManager::reconfigure(self, config).await
    }
}
