//! Outbound adapters. Each submodule implements one or more `application` ports.

pub mod gpio;
pub mod http;
pub mod mqtt;
pub mod persistence;

// Re-export the SQLite pool type so the gateway can construct one without
// pulling sqlx in directly.
pub use sqlx::SqlitePool;
