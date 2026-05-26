use std::sync::Arc;

use async_trait::async_trait;
use local_server_application::{
    ports::{MqttClient, ModbusRepository, PhysicalDeviceRepository, ZigbeeRepository},
    services::ZigbeeRealtimeService,
    DomainError,
};
use local_server_core::entities::scan_log::ScanLog;
use local_server_infrastructure::{run_ingestion, ModbusGateway, RumqttcClient};
use tokio::sync::{Mutex, RwLock};

pub struct RuntimeMqttManager {
    topic_prefix: String,
    zigbee_repo: Arc<dyn ZigbeeRepository>,
    phys_repo: Arc<dyn PhysicalDeviceRepository>,
    realtime_svc: Arc<ZigbeeRealtimeService>,
    modbus_gateway: Arc<ModbusGateway>,
    modbus_repo: Arc<dyn ModbusRepository>,
    scan_log: ScanLog,
    current_url: RwLock<Option<String>>,
    client: RwLock<Option<Arc<RumqttcClient>>>,
    ingestion_task: Mutex<Option<tokio::task::JoinHandle<()>>>,
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
            current_url: RwLock::new(None),
            client: RwLock::new(None),
            ingestion_task: Mutex::new(None),
            reconnect_lock: Mutex::new(()),
        }
    }

    pub async fn reconfigure(&self, mqtt_url: Option<&str>) -> Result<(), DomainError> {
        let _guard = self.reconnect_lock.lock().await;
        match mqtt_url.map(str::trim).filter(|v| !v.is_empty()) {
            Some(url) => self.connect(url).await,
            None => self.disconnect().await,
        }
    }

    async fn connect(&self, mqtt_url: &str) -> Result<(), DomainError> {
        let new_client = RumqttcClient::connect(mqtt_url, &self.topic_prefix)
            .await
            .map_err(|e| DomainError::DependencyUnavailable(format!("MQTT connect: {e}")))?;

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

        if let Some(task) = self.ingestion_task.lock().await.take() {
            task.abort();
        }

        let old = self.client.write().await.replace(new_client);
        if let Some(prev) = old {
            prev.shutdown();
        }

        *self.ingestion_task.lock().await = Some(new_task);
        *self.current_url.write().await = Some(mqtt_url.to_string());
        Ok(())
    }

    async fn disconnect(&self) -> Result<(), DomainError> {
        if let Some(task) = self.ingestion_task.lock().await.take() {
            task.abort();
        }
        if let Some(client) = self.client.write().await.take() {
            client.shutdown();
        }
        *self.current_url.write().await = None;
        Ok(())
    }

    pub async fn is_connected(&self) -> bool {
        self.client.read().await.is_some()
    }

    pub async fn current_url(&self) -> Option<String> {
        self.current_url.read().await.clone()
    }
}

#[async_trait]
impl MqttClient for RuntimeMqttManager {
    async fn publish(&self, topic: &str, payload: &[u8]) -> Result<(), DomainError> {
        let client = self.client.read().await.clone();
        match client {
            Some(c) => c.publish(topic, payload).await,
            None => Err(DomainError::DependencyUnavailable("MQTT not configured".into())),
        }
    }

    async fn is_connected(&self) -> bool {
        RuntimeMqttManager::is_connected(self).await
    }

    async fn current_url(&self) -> Option<String> {
        RuntimeMqttManager::current_url(self).await
    }

    async fn reconfigure(&self, mqtt_url: Option<&str>) -> Result<(), DomainError> {
        RuntimeMqttManager::reconfigure(self, mqtt_url).await
    }
}
