'use client';

import { useCallback, useState } from 'react';
import { zigbeeTelemetryManager } from '../lib/zigbee-telemetry-manager';
import type { ZigbeeCommandAck } from '../lib/zigbee-telemetry-manager';

type CommandState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'ok'; topic: string }
  | { status: 'error'; error: string };

export function useZigbeeCommand() {
  const [state, setState] = useState<CommandState>({ status: 'idle' });

  const sendCommand = useCallback(
    async (
      device: { deviceIeeeAddr?: string; physicalDeviceId?: string },
      payload: Record<string, unknown>,
    ): Promise<ZigbeeCommandAck> => {
      setState({ status: 'pending' });
      try {
        const ack = await zigbeeTelemetryManager.sendCommand(device, payload);
        if (ack.ok) {
          setState({ status: 'ok', topic: ack.topic });
        } else {
          setState({ status: 'error', error: ack.error });
        }
        return ack;
      } catch (e) {
        const error = e instanceof Error ? e.message : 'Unknown error';
        setState({ status: 'error', error });
        return { ok: false, error };
      }
    },
    [],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, sendCommand, reset };
}
