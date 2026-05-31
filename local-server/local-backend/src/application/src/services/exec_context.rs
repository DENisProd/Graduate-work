use std::sync::Arc;

use crate::ports::{MqttClient, PhysicalDeviceRepository, ScenarioExecutionRepository, ZigbeeRepository};

/// Runtime context passed to condition evaluators and action executors.
pub struct ExecContext {
    pub mqtt: Option<Arc<dyn MqttClient>>,
    pub zigbee_repo: Arc<dyn ZigbeeRepository>,
    pub phys_repo: Arc<dyn PhysicalDeviceRepository>,
    pub exec_repo: Arc<dyn ScenarioExecutionRepository>,
    pub mqtt_prefix: String,
}
