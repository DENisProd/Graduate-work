//! Domain core for the local-server.
//!
//! This crate is intentionally free of infrastructure concerns (no I/O, no
//! framework dependencies). It defines pure domain entities and a single
//! `DomainError` enum used across application services.

pub mod entities;
pub mod errors;

pub use errors::DomainError;
