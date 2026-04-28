use tokio::sync::broadcast;
use local_server_core::entities::zigbee::{PairingEvent, ZigbeeDeviceState};

/// In-process pub/sub bus for Zigbee state changes and pairing events.
///
/// The MQTT ingestion task calls `publish_*` methods; the Socket.IO gateway
/// subscribes and forwards events to connected WebSocket clients.
pub struct ZigbeeRealtimeService {
    state_tx: broadcast::Sender<ZigbeeDeviceState>,
    pairing_tx: broadcast::Sender<PairingEvent>,
}

impl ZigbeeRealtimeService {
    pub fn new() -> Self {
        let (state_tx, _) = broadcast::channel(256);
        let (pairing_tx, _) = broadcast::channel(64);
        Self { state_tx, pairing_tx }
    }

    pub fn publish_state(&self, event: ZigbeeDeviceState) {
        self.state_tx.send(event).ok();
    }

    pub fn publish_pairing(&self, event: PairingEvent) {
        self.pairing_tx.send(event).ok();
    }

    pub fn subscribe_state(&self) -> broadcast::Receiver<ZigbeeDeviceState> {
        self.state_tx.subscribe()
    }

    pub fn subscribe_pairing(&self) -> broadcast::Receiver<PairingEvent> {
        self.pairing_tx.subscribe()
    }
}

impl Default for ZigbeeRealtimeService {
    fn default() -> Self {
        Self::new()
    }
}
