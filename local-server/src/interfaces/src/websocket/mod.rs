//! Socket.IO `/zigbee` namespace gateway (socketioxide 0.15).

mod gateway;
pub mod protocol;

use std::sync::Arc;

use axum::Router;
use socketioxide::SocketIo;

use local_server_application::{
    ports::{MqttClient, ZigbeeRepository},
    services::ZigbeeRealtimeService,
};

/// Wrap an existing axum `Router` with the Socket.IO layer.
///
/// Sets up the `/zigbee` namespace, registers all event handlers, and starts
/// the background broadcaster tasks. The returned `Router` handles both HTTP
/// and WebSocket connections.
pub fn apply_to_router(
    router: Router,
    mqtt: Option<Arc<dyn MqttClient>>,
    repo: Arc<dyn ZigbeeRepository>,
    realtime_svc: Arc<ZigbeeRealtimeService>,
    prefix: String,
) -> Router {
    let (ws_layer, io) = SocketIo::builder().build_layer();
    gateway::setup_namespace(&io, mqtt, repo, prefix);
    gateway::spawn_broadcasters(io, realtime_svc);
    router.layer(ws_layer)
}
