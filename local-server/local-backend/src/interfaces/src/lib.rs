//! Inbound adapters. The HTTP and websocket layers depend exclusively on
//! `application` ports — never on infrastructure types.

pub mod http;
pub mod state;
pub mod websocket;

pub use state::HttpAppState;
