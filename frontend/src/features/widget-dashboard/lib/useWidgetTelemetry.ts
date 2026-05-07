'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { zigbeeTelemetryManager } from '@/features/access-control/lib/zigbee-telemetry-manager';
import type { ZigbeeDeviceListItem, ZigbeeStateWire } from '@/types/api';

let consumerId = 0;

export function readPayloadValue(state: ZigbeeStateWire, key: string): unknown {
  if (key in state.payload) return state.payload[key];
  const m = state.metrics as unknown as Record<string, unknown>;
  if (key in m) return m[key];
  return null;
}

export function useWidgetTelemetry(devices: ZigbeeDeviceListItem[]) {
  const idRef = useRef<string | null>(null);
  const [states, setStates] = useState<Map<string, ZigbeeStateWire>>(new Map());
  const [connected, setConnected] = useState(false);

  const onState = useCallback((wire: ZigbeeStateWire) => {
    setStates((prev) => {
      const next = new Map(prev);
      const key = wire.physicalDeviceId ?? wire.deviceIeeeAddr;
      if (key) next.set(key, wire);
      if (wire.physicalDeviceId) next.set(wire.physicalDeviceId, wire);
      if (wire.deviceIeeeAddr) next.set(wire.deviceIeeeAddr, wire);
      return next;
    });
  }, []);

  useEffect(() => {
    if (idRef.current === null) {
      idRef.current = `widget-dash-${++consumerId}`;
    }
    const id = idRef.current;

    zigbeeTelemetryManager.acquire();

    const unsub = zigbeeTelemetryManager.subscribeConnection(() => {
      setConnected(zigbeeTelemetryManager.isConnected());
    });
    setConnected(zigbeeTelemetryManager.isConnected());

    return () => {
      zigbeeTelemetryManager.unregisterConsumer(id);
      zigbeeTelemetryManager.release();
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!idRef.current) return;
    if (devices.length === 0) {
      zigbeeTelemetryManager.unregisterConsumer(idRef.current);
      return;
    }
    zigbeeTelemetryManager.registerConsumer(idRef.current, devices, onState);
  }, [devices, onState]);

  const sendCommand = useCallback(
    async (device: { deviceIeeeAddr?: string; physicalDeviceId?: string }, payload: Record<string, unknown>) => {
      return zigbeeTelemetryManager.sendCommand(device, payload);
    },
    [],
  );

  return { states, connected, sendCommand };
}
