//! Outbound ports — traits implemented by `infrastructure` adapters.
//!
//! At LS-001 only the `HealthChecker` port is required; subsequent tasks add
//! `DeviceRepository`, `MqttClient`, `CloudSyncClient`, `OtaClient` etc.

pub mod health;

pub use health::{HealthChecker, HealthError};
