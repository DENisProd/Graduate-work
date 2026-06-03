'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ZigbeeDeviceListItem, ZigbeeStateWire } from '@/types/api';
import {
  buildZigbeeSubscribePayload,
  resolveZigbeeStateForDevice,
} from '@/features/access-control/lib/zigbee-device-utils';
import { zigbeeTelemetryManager } from '@/features/access-control/lib/zigbee-telemetry-manager';

function subscribeZigbeeConnection(onStoreChange: () => void) {
  return zigbeeTelemetryManager.subscribeConnection(onStoreChange);
}

function useZigbeeSocketLive(): boolean {
  return useSyncExternalStore(
    subscribeZigbeeConnection,
    () => zigbeeTelemetryManager.isConnected(),
    () => false
  );
}

export function useZigbeeTelemetry(options: {
  enabled: boolean;
  devices: ZigbeeDeviceListItem[];
}) {
  const { enabled, devices } = options;
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const wireMapRef = useRef(new Map<string, ZigbeeStateWire>());
  const [, setTick] = useState(0);

  const devicesKey = useMemo(
    () =>
      [...devices]
        .map((d) => d.id)
        .sort()
        .join('\0'),
    [devices]
  );

  const subscribePayload = useMemo(() => buildZigbeeSubscribePayload(devices), [devices]);
  const canSubscribe =
    subscribePayload.deviceIeeeAddrs.length > 0 || subscribePayload.physicalDeviceIds.length > 0;

  const onState = useCallback((wire: ZigbeeStateWire) => {
    wireMapRef.current.set(wire.deviceIeeeAddr, wire);
    if (wire.physicalDeviceId) {
      wireMapRef.current.set(wire.physicalDeviceId, wire);
    }
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const wireMap = wireMapRef.current;
    if (!enabled || !canSubscribe) return;
    const id = `zc-${instanceId}`;
    zigbeeTelemetryManager.acquire();
    zigbeeTelemetryManager.registerConsumer(id, devices, onState);
    return () => {
      zigbeeTelemetryManager.unregisterConsumer(id);
      zigbeeTelemetryManager.release();
      wireMap.clear();
      setTick((t) => t + 1);
    };
  }, [enabled, canSubscribe, devicesKey, devices, instanceId, onState]);

  const isSocketConnected = useZigbeeSocketLive();

  const getLiveState = useCallback((device: ZigbeeDeviceListItem) => {
    return resolveZigbeeStateForDevice(wireMapRef.current, device);
  }, []);

  return {
    getLiveState,
    isSocketConnected,
    canSubscribe,
  };
}
