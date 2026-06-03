import { io, type Socket } from 'socket.io-client';
import { env } from '@/config/env.config';
import { useUserStore } from '@/store/user-store';
import type { ZigbeeDeviceListItem, ZigbeeStateWire } from '@/types/api';
import {
  buildZigbeeSubscribePayload,
  stableZigbeeSubscribeKey,
} from './zigbee-device-utils';

type ZigbeeSubscribeAck =
  | { ok: true; subscribed: number; snapshots: ZigbeeStateWire[] }
  | { ok: false; error: string };

type ZigbeeUnsubscribeAck =
  | { ok: true; left: 'all' | number }
  | { ok: false; error: string };

export type ZigbeeCommandAck =
  | { ok: true; topic: string }
  | { ok: false; error: string };

export interface ZigbeePairingEvent {
  type: 'joined' | 'interview_started' | 'interview_done' | 'interview_failed';
  ieeeAddr: string;
  friendlyName: string;
  supported?: boolean;
  definition?: Record<string, unknown> | null;
  capabilities?: string[];
  physicalDeviceId?: string | null;
  model?: string | null;
  manufacturer?: string | null;
}

export interface ZigbeePairingStatus {
  permitJoin: boolean;
  timeout?: number | null;
}

type PairingEventListener = (event: ZigbeePairingEvent) => void;
type PairingStatusListener = (status: ZigbeePairingStatus) => void;

function socketBaseFromPhysicalDevicesApiBase(baseUrl: string): string {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return baseUrl.replace(/\/+$/, '').replace(/\/api\/.*$/i, '');
  }
}

function readAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const keys = ['keycloak-token', 'access_token', 'token', 'smart-home-token'];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === 'string') return parsed;
      if (parsed && typeof parsed === 'object') {
        const o = parsed as Record<string, unknown>;
        if (typeof o.access_token === 'string') return o.access_token;
        if (typeof o.accessToken === 'string') return o.accessToken;
        if (typeof o.token === 'string') return o.token;
      }
    } catch {
      return raw;
    }
  }
  return null;
}

function readUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return useUserStore.getState().user?.id ?? null;
}

type Consumer = {
  deviceIeeeAddrs: Set<string>;
  physicalDeviceIds: Set<string>;
  onState: (wire: ZigbeeStateWire) => void;
};

class ZigbeeTelemetryManager {
  private refCount = 0;
  private socket: Socket | null = null;
  private consumers = new Map<string, Consumer>();
  private currentMergedKey: string | null = null;
  private connectionListeners = new Set<() => void>();
  private applyTail: Promise<void> = Promise.resolve();
  private pairingEventListeners = new Set<PairingEventListener>();
  private pairingStatusListeners = new Set<PairingStatusListener>();
  private pairingActive = false;
  private pairingTime = 254;
  private pairingHouseId: string | null = null;
  private watchingPairing = false;

  subscribeConnection(onStoreChange: () => void): () => void {
    this.connectionListeners.add(onStoreChange);
    return () => this.connectionListeners.delete(onStoreChange);
  }

  private emitConnectionChange() {
    this.connectionListeners.forEach((cb) => cb());
  }

  isConnected(): boolean {
    return Boolean(this.socket?.connected);
  }

  acquire() {
    this.refCount += 1;
    if (this.refCount === 1) {
      this.openSocket();
    }
  }

  release() {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0) {
      this.closeSocket();
    }
  }

  registerConsumer(
    id: string,
    devices: ZigbeeDeviceListItem[],
    onState: (wire: ZigbeeStateWire) => void
  ) {
    const p = buildZigbeeSubscribePayload(devices);
    this.consumers.set(id, {
      deviceIeeeAddrs: new Set(p.deviceIeeeAddrs),
      physicalDeviceIds: new Set(p.physicalDeviceIds),
      onState,
    });
    this.enqueueApplySubscription();
  }

  unregisterConsumer(id: string) {
    this.consumers.delete(id);
    this.enqueueApplySubscription();
  }

  private mergePayload(): { deviceIeeeAddrs: string[]; physicalDeviceIds: string[] } {
    const ieee = new Set<string>();
    const ids = new Set<string>();
    for (const c of this.consumers.values()) {
      c.deviceIeeeAddrs.forEach((x) => ieee.add(x));
      c.physicalDeviceIds.forEach((x) => ids.add(x));
    }
    return {
      deviceIeeeAddrs: [...ieee].slice(0, 200),
      physicalDeviceIds: [...ids].slice(0, 200),
    };
  }

  private dispatchState(wire: ZigbeeStateWire) {
    for (const c of this.consumers.values()) {
      const match =
        c.deviceIeeeAddrs.has(wire.deviceIeeeAddr) ||
        (wire.physicalDeviceId != null && c.physicalDeviceIds.has(wire.physicalDeviceId));
      if (match) c.onState(wire);
    }
  }

  private openSocket() {
    if (this.socket) return;
    const base = socketBaseFromPhysicalDevicesApiBase(env.PHYSICAL_DEVICES_API_BASE_URL);
    const socket = io(`${base}/zigbee`, {
      path: '/socket.io/',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
      auth: {
        token: readAuthToken() ?? undefined,
        userId: readUserId() ?? undefined,
      },
    });
    this.socket = socket;
    this.emitConnectionChange();

    socket.on('connect', () => {
      this.currentMergedKey = null;
      this.emitConnectionChange();
      this.enqueueApplySubscription();
      if (this.pairingActive && this.pairingHouseId) {
        void this.emitAck<{ ok: boolean; error?: string }>(
          'zigbee:pairing:start',
          { houseId: this.pairingHouseId, time: this.pairingTime },
        );
      } else if (this.pairingActive) {
        this.pairingActive = false;
      } else if (this.watchingPairing) {
        void this.emitAck<{ ok: boolean }>('zigbee:pairing:watch', {});
      }
    });

    socket.on('disconnect', () => {
      this.currentMergedKey = null;
      this.emitConnectionChange();
    });

    socket.on('connect_error', () => {
      this.emitConnectionChange();
    });

    socket.on('zigbee:state', (wire: ZigbeeStateWire) => {
      this.dispatchState(wire);
    });

    socket.on('zigbee:pairing:event', (event: ZigbeePairingEvent) => {
      this.pairingEventListeners.forEach((cb) => cb(event));
    });

    socket.on('zigbee:pairing:status', (status: ZigbeePairingStatus) => {
      this.pairingStatusListeners.forEach((cb) => cb(status));
    });
  }

  private closeSocket() {
    this.pairingActive = false;
    this.pairingHouseId = null;
    this.watchingPairing = false;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentMergedKey = null;
    this.emitConnectionChange();
  }

  private enqueueApplySubscription() {
    this.applyTail = this.applyTail
      .then(() => this.applyMergedSubscriptionInner())
      .catch((e: unknown) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ZigbeeTelemetry] apply subscription failed', e);
        }
      });
  }

  async sendCommand(
    device: { deviceIeeeAddr?: string; physicalDeviceId?: string },
    payload: Record<string, unknown>,
  ): Promise<ZigbeeCommandAck> {
    const result = await this.emitAck<ZigbeeCommandAck>('zigbee:command', {
      ...device,
      payload,
    });
    return result ?? { ok: false, error: 'No response from server (timeout)' };
  }

  async watchPairing(): Promise<void> {
    this.watchingPairing = true;
    await this.emitAck<{ ok: boolean }>('zigbee:pairing:watch', {});
  }

  async unwatchPairing(): Promise<void> {
    this.watchingPairing = false;
    await this.emitAck<{ ok: boolean }>('zigbee:pairing:unwatch', {});
  }

  async startPairing(
    houseId: string,
    time = 254
  ): Promise<{ ok: boolean; error?: string }> {
    const result = await this.emitAck<{ ok: boolean; error?: string }>(
      'zigbee:pairing:start',
      { houseId, time },
    );
    if (result?.ok) {
      this.pairingActive = true;
      this.pairingTime = time;
      this.pairingHouseId = houseId;
    }
    return result ?? { ok: false, error: 'No response from server (timeout)' };
  }

  async stopPairing(houseId: string): Promise<{ ok: boolean; error?: string }> {
    this.pairingActive = false;
    this.pairingHouseId = null;
    const result = await this.emitAck<{ ok: boolean; error?: string }>(
      'zigbee:pairing:stop',
      { houseId },
    );
    return result ?? { ok: false, error: 'No response from server (timeout)' };
  }

  onPairingEvent(listener: PairingEventListener): () => void {
    this.pairingEventListeners.add(listener);
    return () => this.pairingEventListeners.delete(listener);
  }

  onPairingStatus(listener: PairingStatusListener): () => void {
    this.pairingStatusListeners.add(listener);
    return () => this.pairingStatusListeners.delete(listener);
  }

  private emitAck<T>(event: string, data: unknown): Promise<T | undefined> {
    const socket = this.socket;
    if (!socket?.connected) return Promise.resolve(undefined);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(undefined), 15_000);
      socket.emit(event, data, (ack: T) => {
        clearTimeout(timer);
        resolve(ack);
      });
    });
  }

  private async applyMergedSubscriptionInner() {
    const socket = this.socket;
    if (!socket?.connected) return;

    const merged = this.mergePayload();
    const key = stableZigbeeSubscribeKey(merged);

    if (merged.deviceIeeeAddrs.length === 0 && merged.physicalDeviceIds.length === 0) {
      if (this.currentMergedKey !== null) {
        await this.emitAck<ZigbeeUnsubscribeAck>('zigbee:unsubscribe', {});
      }
      this.currentMergedKey = null;
      return;
    }

    if (key === this.currentMergedKey) return;

    if (this.currentMergedKey !== null) {
      await this.emitAck<ZigbeeUnsubscribeAck>('zigbee:unsubscribe', {});
    }

    const ack = await this.emitAck<ZigbeeSubscribeAck>('zigbee:subscribe', merged);
    if (ack && ack.ok === true && Array.isArray(ack.snapshots)) {
      for (const s of ack.snapshots) {
        this.dispatchState(s);
      }
      this.currentMergedKey = key;
      return;
    }
    if (ack && ack.ok === false && process.env.NODE_ENV === 'development') {
      console.warn('[ZigbeeTelemetry] zigbee:subscribe ack error:', ack.error);
    }
    this.currentMergedKey = null;
  }
}

export const zigbeeTelemetryManager = new ZigbeeTelemetryManager();
