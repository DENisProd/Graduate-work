//! Outbound adapters. Each submodule implements one or more `application` ports.

pub mod gpio;
pub mod http;
pub mod mqtt;
pub mod persistence;

pub use mqtt::{run_ingestion, RumqttcClient};
pub use persistence::{OutboxWriter, SqliteDeviceRepo, SqlitePhysicalDeviceRepo, SqliteZigbeeRepo};
pub use sqlx::SqlitePool;
