//! Domain entities. Each module owns one aggregate root and its value objects.
//!
//! At the LS-001 milestone these are minimal stubs; subsequent tasks (LS-002+)
//! flesh them out as the corresponding endpoints are implemented.

pub mod access;
pub mod device;
pub mod physical_device;
pub mod scenario;
pub mod zigbee;
