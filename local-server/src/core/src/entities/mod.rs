//! Domain entities. Each module owns one aggregate root and its value objects.
//!
//! At the LS-001 milestone these are minimal stubs; subsequent tasks (LS-002+)
//! flesh them out as the corresponding endpoints are implemented.

pub mod access;
pub mod device;
pub mod modbus;
pub mod physical_device;
pub mod scan_log;
pub mod scenario;
pub mod widget_dashboard;
pub mod zigbee;
