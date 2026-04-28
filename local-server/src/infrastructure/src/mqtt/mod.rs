//! MQTT adapter: `rumqttc`-backed client + Zigbee2MQTT ingestion loop.

mod client;
mod ingest;

pub use client::{MqttMessage, RumqttcClient};
pub use ingest::run_ingestion;
