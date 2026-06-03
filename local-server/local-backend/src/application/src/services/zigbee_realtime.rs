use tokio::sync::broadcast;
use local_server_core::entities::zigbee::{PairingEvent, ZigbeeDeviceState};

pub struct ZigbeeRealtimeService {
    state_tx: broadcast::Sender<ZigbeeDeviceState>,
    pairing_tx: broadcast::Sender<PairingEvent>,
    permit_join_tx: broadcast::Sender<bool>,
}

impl ZigbeeRealtimeService {
    pub fn new() -> Self {
        let (state_tx, _) = broadcast::channel(256);
        let (pairing_tx, _) = broadcast::channel(64);
        let (permit_join_tx, _) = broadcast::channel(8);
        Self { state_tx, pairing_tx, permit_join_tx }
    }

    pub fn publish_state(&self, event: ZigbeeDeviceState) {
        self.state_tx.send(event).ok();
    }

    pub fn publish_pairing(&self, event: PairingEvent) {
        self.pairing_tx.send(event).ok();
    }

    pub fn publish_permit_join(&self, enabled: bool) {
        self.permit_join_tx.send(enabled).ok();
    }

    pub fn subscribe_state(&self) -> broadcast::Receiver<ZigbeeDeviceState> {
        self.state_tx.subscribe()
    }

    pub fn subscribe_pairing(&self) -> broadcast::Receiver<PairingEvent> {
        self.pairing_tx.subscribe()
    }

    pub fn subscribe_permit_join(&self) -> broadcast::Receiver<bool> {
        self.permit_join_tx.subscribe()
    }
}

impl Default for ZigbeeRealtimeService {
    fn default() -> Self {
        Self::new()
    }
}