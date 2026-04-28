//! Application layer.
//!
//! Defines outbound *ports* (traits implemented by `infrastructure`) and
//! inbound use-case *handlers* / domain *services* invoked by `interfaces`.
//!
//! The layer must remain framework-agnostic: no axum, sqlx, rumqttc or
//! reqwest types may leak into signatures here.

pub mod handlers;
pub mod ports;
pub mod services;

pub use local_server_core::DomainError;
