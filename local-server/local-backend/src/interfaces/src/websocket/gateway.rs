use std::sync::Arc;

use socketioxide::extract::{Data, SocketRef};
use socketioxide::SocketIo;
use tokio::sync::broadcast;

use local_server_application::{
    ports::{MqttClient, ZigbeeRepository},
    services::ZigbeeRealtimeService,
};

use super::protocol::{CommandPayload, PairingEventDto, PermitJoinStatusDto, SubscribePayload, ZigbeeStateDto};

pub fn setup_namespace(
    io: &SocketIo,
    mqtt: Arc<dyn MqttClient>,
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

        socket.on("zigbee:unsubscribe", move |socket: SocketRef, Data(data): Data<SubscribePayload>| {
            async move {
                for ieee in &data.device_ieee_addrs {
                    socket.leave(format!("zigbee:{ieee}")).ok();
                }
            }
        });

        socket.on("zigbee:command", {
            let mqtt = mqtt.clone();
            let prefix = prefix.clone();
            move |_socket: SocketRef, Data(data): Data<CommandPayload>| {
                let mqtt = mqtt.clone();
                let prefix = prefix.clone();
                async move {
                    let topic = format!("{}/{}/set", prefix, data.friendly_name);
                    if let Ok(p) = serde_json::to_vec(&data.payload) {
                        mqtt.publish(&topic, &p).await.ok();
                    }
                }
            }
        });

        socket.on("zigbee:pairing:start", {
            let mqtt = mqtt.clone();
            let prefix = prefix.clone();
            move |_socket: SocketRef| {
                let mqtt = mqtt.clone();
                let prefix = prefix.clone();
                async move {
                    let topic = format!("{}/bridge/request/permit_join", prefix);
                    mqtt.publish(&topic, br#"{"time":254}"#).await.ok();
                }
            }
        });

        socket.on("zigbee:pairing:stop", {
            let mqtt = mqtt.clone();
            let prefix = prefix.clone();
            move |_socket: SocketRef| {
                let mqtt = mqtt.clone();
                let prefix = prefix.clone();
                async move {
                    let topic = format!("{}/bridge/request/permit_join", prefix);
                    mqtt.publish(&topic, br#"{"time":0}"#).await.ok();
                }
            }
        });

        socket.on("zigbee:pairing:watch", move |socket: SocketRef| {
            socket.join("pairing").ok();
        });

        socket.on("zigbee:pairing:unwatch", move |socket: SocketRef| {
            socket.leave("pairing").ok();
        });
    });
}

pub fn spawn_broadcasters(io: SocketIo, svc: Arc<ZigbeeRealtimeService>) {
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

    let io2 = io.clone();
    let mut pairing_rx = svc.subscribe_pairing();
    tokio::spawn(async move {
        loop {
            match pairing_rx.recv().await {
                Ok(event) => {
                    let dto = PairingEventDto::from(&event);
                    io2.of("/zigbee")
                        .map(|ns| ns.to("pairing").emit("zigbee:pairing:event", &dto));
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!(dropped = n, "pairing broadcast lagged");
                }
                Err(broadcast::error::RecvError::Closed) => break,
            }
        }
    });

    let mut permit_rx = svc.subscribe_permit_join();
    tokio::spawn(async move {
        loop {
            match permit_rx.recv().await {
                Ok(enabled) => {
                    let dto = PermitJoinStatusDto { permit_join_enabled: enabled };
                    io.of("/zigbee")
                        .map(|ns| ns.to("pairing").emit("zigbee:pairing:status", &dto));
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!(dropped = n, "permit_join broadcast lagged");
                }
                Err(broadcast::error::RecvError::Closed) => break,
            }
        }
    });
}