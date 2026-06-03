
mod gateway;
pub mod protocol;

use std::sync::Arc;

use axum::Router;
use socketioxide::SocketIo;

use local_server_application::{
    ports::{MqttClient, ZigbeeRepository},
    services::ZigbeeRealtimeService,
};

pub fn apply_to_router(
    router: Router,
    mqtt: Arc<dyn MqttClient>,
    repo: Arc<dyn ZigbeeRepository>,
    realtime_svc: Arc<ZigbeeRealtimeService>,
    prefix: String,
) -> Router {
    let (ws_layer, io) = SocketIo::builder().build_layer();
    gateway::setup_namespace(&io, mqtt, repo, prefix);
    gateway::spawn_broadcasters(io, realtime_svc);
    router.layer(ws_layer)
}