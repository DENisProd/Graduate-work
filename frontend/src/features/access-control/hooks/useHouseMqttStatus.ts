'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, houseMqttApi } from '@/lib/api-client';
import type { HouseMqttConfigResponse } from '@/types/api';

export type HouseMqttStatusState =
  | 'loading'
  | 'not_configured'
  | 'disconnected'
  | 'connected';

export function useHouseMqttStatus(houseId: string | null, enabled = true) {
  const [state, setState] = useState<HouseMqttStatusState>('loading');
  const [config, setConfig] = useState<HouseMqttConfigResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal, options?: { preserveState?: boolean }) => {
      if (!houseId || !enabled) {
        setState('not_configured');
        setConfig(null);
        setError(null);
        return;
      }

      if (!options?.preserveState) {
        setState('loading');
      }
      setError(null);

      try {
        const cfg = await houseMqttApi.get(houseId, { signal });
        if (signal?.aborted) return;
        setConfig(cfg);
        if (cfg.enabled === false) {
          setState('disconnected');
          return;
        }
        setState(cfg.status?.connected ? 'connected' : 'disconnected');
        setError(cfg.status?.lastError ?? null);
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof ApiError && err.status === 404) {
          setConfig(null);
          setState('not_configured');
          return;
        }
        setConfig(null);
        setState('disconnected');
        setError(err instanceof Error ? err.message : 'Failed to load MQTT status');
      }
    },
    [enabled, houseId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return {
    state,
    config,
    error,
    isConnected: state === 'connected',
    isConfigured: state !== 'not_configured' && state !== 'loading',
    refetch: () => load(undefined, { preserveState: true }),
  };
}
