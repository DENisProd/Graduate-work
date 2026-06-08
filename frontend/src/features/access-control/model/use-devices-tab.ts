'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import type { HouseDetailsTab } from '@/store/access-control-store';
import { ApiError, zigbeeDevicesApi } from '@/lib/api-client';
import type { ZigbeeDeviceListItem } from '@/types/api';
import { useHouseMqttStatus } from '@/features/access-control/hooks/useHouseMqttStatus';
import { useZigbeeSocketConnection } from '@/features/access-control/hooks/useZigbeeSocketConnection';
import { useZigbeeTelemetry } from '@/features/access-control/hooks/useZigbeeTelemetry';
import { normalizeApiList } from '@/features/access-control/lib/normalize-api-list';

const DEVICES_LIMIT = 12;

export type DevicesLoadError = 'none' | 'forbidden' | 'error';

export function useDevicesTab(houseId: string | null, activeTab: HouseDetailsTab) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const [devices, setDevices] = useState<ZigbeeDeviceListItem[]>([]);
  const [devicesTotal, setDevicesTotal] = useState(0);
  const [devicesPage, setDevicesPage] = useState(1);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<DevicesLoadError>('none');
  const [devicesErrorDetails, setDevicesErrorDetails] = useState<string[] | null>(null);

  const mqttEnabled = activeTab === 'devices' && Boolean(houseId);
  const {
    state: mqttState,
    config: mqttConfig,
    isConnected: isMqttConnected,
    refetch: refetchMqttStatus,
  } = useHouseMqttStatus(houseId, mqttEnabled);

  const isMqttConnectedRef = useRef(isMqttConnected);
  isMqttConnectedRef.current = isMqttConnected;

  const socketEnabled = activeTab === 'devices' && Boolean(houseId);
  const isSocketConnected = useZigbeeSocketConnection(socketEnabled);

  const telemetryEnabled =
    socketEnabled && !devicesLoading && devices.length > 0;

  const { getLiveState } = useZigbeeTelemetry({
    enabled: telemetryEnabled,
    devices,
  });

  const handleError = useCallback(
    (error: unknown, setError: (state: DevicesLoadError) => void) => {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          router.push('/login');
          return;
        }
        if (error.status === 403) {
          setError('forbidden');
          return;
        }
        if (error.status === 0) {
          setDevicesErrorDetails([
            'Failed to load resource: net::ERR_CONNECTION_REFUSED',
            `details: ${error.message || 'Network error'}`,
          ]);
          setError('error');
          return;
        }
        if (error.status >= 500) {
          showToast(t('common.error'), 'error');
          setError('error');
          return;
        }
      }
      setDevicesErrorDetails(null);
      showToast(t('common.error'), 'error');
      setError('error');
    },
    [router, showToast, t]
  );

  const loadDevices = useCallback(
    async (signal?: AbortSignal) => {
      if (!houseId) return;
      setDevicesLoading(true);
      setDevicesError('none');
      setDevicesErrorDetails(null);
      try {
        if (isMqttConnectedRef.current) {
          try {
            await zigbeeDevicesApi.requestSyncFromBridge(houseId, { signal });
          } catch (error) {
            if (signal?.aborted) return;
            if (error instanceof ApiError) {
              if (error.status === 401) {
                router.push('/login');
                return;
              }
              if (error.status === 403) {
                showToast(t('errors.unauthorized'), 'error');
                return;
              }
              if (error.status === 503) {
                showToast(t('admin.accessControl.connectedDevices.mqttNotConnected'), 'error');
              } else {
                showToast(t('common.error'), 'error');
              }
            } else {
              showToast(t('common.error'), 'error');
            }
          }
        }

        if (signal?.aborted) return;

        const result = await zigbeeDevicesApi.list({
          houseId,
          page: devicesPage,
          limit: DEVICES_LIMIT,
          signal,
        });
        const normalized = normalizeApiList<ZigbeeDeviceListItem>(result);
        if (signal?.aborted) return;
        setDevices(normalized.items);
        setDevicesTotal(normalized.total);
      } catch (error) {
        if (signal?.aborted) return;
        handleError(error, setDevicesError);
      } finally {
        if (!signal?.aborted) setDevicesLoading(false);
      }
    },
    [devicesPage, handleError, houseId, router, showToast, t]
  );

  const removeDevice = useCallback((id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }, []);

  useEffect(() => {
    if (activeTab !== 'devices') return;
    const controller = new AbortController();
    void loadDevices(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadDevices]);

  const devicesPages = Math.max(1, Math.ceil(devicesTotal / DEVICES_LIMIT));

  return {
    devices,
    devicesLoading,
    devicesError,
    devicesErrorDetails,
    devicesPage,
    devicesPages,
    getLiveState,
    isSocketConnected,
    loadDevices,
    removeDevice,
    setDevicesPage,
    mqttState,
    mqttConfig,
    refetchMqttStatus,
  };
}
