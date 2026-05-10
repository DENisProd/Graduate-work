//! Outbound ports — traits implemented by `infrastructure` adapters.

pub mod device_repository;
pub mod health;
pub mod mqtt_client;
pub mod physical_device_repository;
pub mod scenario_repository;
pub mod zigbee_repository;

pub use device_repository::DeviceRepository;
pub use health::{HealthChecker, HealthError};
pub use mqtt_client::MqttClient;
pub use physical_device_repository::PhysicalDeviceRepository;
pub use scenario_repository::{
    CreateScenarioCmd, ScenarioExecutionRepository, ScenarioRepository, UpdateScenarioCmd,
};
pub use zigbee_repository::ZigbeeRepository;
