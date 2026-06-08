'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { zigbeeTelemetryManager } from '@/features/access-control/lib/zigbee-telemetry-manager';

function subscribeZigbeeConnection(onStoreChange: () => void) {
  return zigbeeTelemetryManager.subscribeConnection(onStoreChange);
}

/** Keeps the shared Socket.IO client alive while `enabled` (e.g. devices tab or pairing modal). */
export function useZigbeeSocketConnection(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    zigbeeTelemetryManager.acquire();
    return () => {
      zigbeeTelemetryManager.release();
    };
  }, [enabled]);

  return useSyncExternalStore(
    subscribeZigbeeConnection,
    () => zigbeeTelemetryManager.isConnected(),
    () => false,
  );
}
