use std::sync::Arc;

use socketioxide::extract::{Data, SocketRef};
use socketioxide::SocketIo;
use tokio::sync::broadcast;

use local_server_application::{
    ports::{MqttClient, ZigbeeRepository},
    services::ZigbeeRealtimeService,
};

use super::protocol::{CommandPayload, PairingStatusDto, SubscribePayload, ZigbeeStateDto};

/// Register all event handlers for the `/zigbee` namespace.
pub fn setup_namespace(
    io: &SocketIo,
    mqtt: Option<Arc<dyn MqttClient>>,
    repo: Arc<dyn ZigbeeRepository>,
    prefix: String,
) {
    let mqtt2 = mqtt.clone();
    let repo2 = repo.clone();
    let prefix2 = prefix.clone();

    io.ns("/zigbee", move |socket: SocketRef| {
        let mqtt = mqtt2.clone();
        let repo = repo2.clone();
        let prefix = prefix2.clone();

        // zigbee:subscribe { deviceIeeeAddrs: ["0x...", ...] }
        // → join room "zigbee:{ieee}" and emit last-known state as snapshot
        socket.on("zigbee:subscribe", {
            let repo = repo.clone();
            move |socket: SocketRef, Data(data): Data<SubscribePayload>| {
                let repo = repo.clone();
                async move {
                    for ieee in &data.device_ieee_addrs {
                        socket.join(format!("zigbee:{ieee}")).ok();
                    }
                    for ieee in &data.device_ieee_addrs {
                        if let Ok(Some(state)) = repo.last_state(ieee).await {
                            socket.emit("zigbee:state", &ZigbeeStateDto::from(&state)).ok();
                        }
                    }
                }
            }
        });

        // zigbee:unsubscribe { deviceIeeeAddrs: [...] }
        socket.on("zigbee:unsubscribe", move |socket: SocketRef, Data(data): Data<SubscribePayload>| {
            async move {
                for ieee in &data.device_ieee_addrs {
                    socket.leave(format!("zigbee:{ieee}")).ok();
                }
            }
        });

        // zigbee:command { friendlyName, payload }
        socket.on("zigbee:command", {
            let mqtt = mqtt.clone();
            let prefix = prefix.clone();
            move |_socket: SocketRef, Data(data): Data<CommandPayload>| {
                let mqtt = mqtt.clone();
                let prefix = prefix.clone();
                async move {
                    let Some(client) = mqtt else { return };
                    let topic = format!("{}/{}/set", prefix, data.friendly_name);
                    if let Ok(p) = serde_json::to_vec(&data.payload) {
                        client.publish(&topic, &p).await.ok();
                    }
                }
            }
        });

        // zigbee:pairing:start → permit_join true
        socket.on("zigbee:pairing:start", {
            let mqtt = mqtt.clone();
            let prefix = prefix.clone();
            move |_socket: SocketRef| {
                let mqtt = mqtt.clone();
                let prefix = prefix.clone();
                async move {
                    let Some(client) = mqtt else { return };
                    let topic = format!("{}/bridge/request/permit_join", prefix);
                    client.publish(&topic, br#"{"value":true,"time":300}"#).await.ok();
                }
            }
        });

        // zigbee:pairing:stop → permit_join false
        socket.on("zigbee:pairing:stop", {
            let mqtt = mqtt.clone();
            let prefix = prefix.clone();
            move |_socket: SocketRef| {
                let mqtt = mqtt.clone();
                let prefix = prefix.clone();
                async move {
                    let Some(client) = mqtt else { return };
                    let topic = format!("{}/bridge/request/permit_join", prefix);
                    client.publish(&topic, br#"{"value":false}"#).await.ok();
                }
            }
        });

        // zigbee:pairing:watch → join "pairing" room
        socket.on("zigbee:pairing:watch", move |socket: SocketRef| {
            socket.join("pairing").ok();
        });

        // zigbee:pairing:unwatch → leave "pairing" room
        socket.on("zigbee:pairing:unwatch", move |socket: SocketRef| {
            socket.leave("pairing").ok();
        });
    });
}

/// Spawn background tasks that bridge the in-process broadcast channels to
/// Socket.IO rooms. Must be called AFTER `setup_namespace` so the namespace
/// is already registered.
pub fn spawn_broadcasters(io: SocketIo, svc: Arc<ZigbeeRealtimeService>) {
    // State broadcast: ZigbeeDeviceState → "zigbee:state" in room "zigbee:{ieee}"
    let io1 = io.clone();
    let mut state_rx = svc.subscribe_state();
    tokio::spawn(async move {
        loop {
            match state_rx.recv().await {
                Ok(state) => {
                    let room = format!("zigbee:{}", state.device_ieee_addr);
                    let dto = ZigbeeStateDto::from(&state);
                    io1.of("/zigbee")
                        .map(|ns| ns.to(room).emit("zigbee:state", &dto));
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!(dropped = n, "zigbee state broadcast lagged");
                }
                Err(broadcast::error::RecvError::Closed) => break,
            }
        }
    });

    // Pairing broadcast: PairingEvent → "zigbee:pairing:status" in "pairing" room
    let mut pairing_rx = svc.subscribe_pairing();
    tokio::spawn(async move {
        loop {
            match pairing_rx.recv().await {
                Ok(event) => {
                    let dto = PairingStatusDto::from(&event);
                    io.of("/zigbee")
                        .map(|ns| ns.to("pairing").emit("zigbee:pairing:status", &dto));
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!(dropped = n, "pairing broadcast lagged");
                }
                Err(broadcast::error::RecvError::Closed) => break,
            }
        }
    });
}
