'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { useAddDeviceModalStore } from '@/store/add-device-modal-store';
import type { HouseDetailsTab } from '@/store/access-control-store';
import { ApiError, zigbeeDevicesApi } from '@/lib/api-client';
import type { ZigbeeDeviceListItem } from '@/types/api';
import { useZigbeeTelemetry } from '@/features/access-control/hooks/useZigbeeTelemetry';
import { DeviceListCard } from './DeviceListCard';

interface DevicesTabProps {
  houseId: string | null;
  activeTab: HouseDetailsTab;
}

export function DevicesTab({ houseId, activeTab }: DevicesTabProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const openAddDeviceModal = useAddDeviceModalStore((s) => s.open);
  const addDeviceModalOpen = useAddDeviceModalStore((s) => s.isOpen);
  const prevAddDeviceModalOpenRef = useRef(addDeviceModalOpen);

  const [devices, setDevices] = useState<ZigbeeDeviceListItem[]>([]);
  const [devicesTotal, setDevicesTotal] = useState(0);
  const [devicesPage, setDevicesPage] = useState(1);
  const devicesLimit = 12;
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<'none' | 'forbidden' | 'error'>('none');
  const [isBridgeAvailable, setIsBridgeAvailable] = useState(true);

  const telemetryEnabled =
    activeTab === 'devices' && Boolean(houseId) && !devicesLoading && devices.length > 0;

  const { getLiveState, isSocketConnected, canSubscribe } = useZigbeeTelemetry({
    enabled: telemetryEnabled,
    devices,
  });

  const normalizeList = useCallback(<T,>(result: unknown) => {
    if (Array.isArray(result)) {
      return { items: result as T[], total: result.length };
    }
    if (result && typeof result === 'object') {
      const obj = result as Record<string, unknown>;
      if (Array.isArray(obj.items)) {
        return {
          items: obj.items as T[],
          total: typeof obj.total === 'number' ? obj.total : (obj.items as T[]).length,
        };
      }
      if (Array.isArray(obj.data)) {
        return {
          items: obj.data as T[],
          total: typeof obj.total === 'number' ? obj.total : (obj.data as T[]).length,
        };
      }
      if (Array.isArray(obj.content)) {
        return {
          items: obj.content as T[],
          total:
            typeof obj.totalElements === 'number'
              ? obj.totalElements
              : (obj.content as T[]).length,
        };
      }
    }
    return { items: [] as T[], total: 0 };
  }, []);

  const handleError = useCallback(
    (error: unknown, setError: (state: 'none' | 'forbidden' | 'error') => void) => {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          router.push('/login');
          return;
        }
        if (error.status === 403) {
          setError('forbidden');
          return;
        }
        if (error.status >= 500) {
          showToast(t('common.error'), 'error');
          setError('error');
          return;
        }
      }
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
      try {
        try {
          await zigbeeDevicesApi.requestSyncFromBridge({ signal });
          if (!signal?.aborted) setIsBridgeAvailable(true);
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
              setIsBridgeAvailable(false);
              showToast(t('admin.accessControl.connectedDevices.syncUnavailable'), 'error');
            } else {
              showToast(t('common.error'), 'error');
            }
          } else {
            showToast(t('common.error'), 'error');
          }
        }

        if (signal?.aborted) return;

        const result = await zigbeeDevicesApi.list({
          houseId,
          page: devicesPage,
          limit: devicesLimit,
          signal,
        });
        const normalized = normalizeList<ZigbeeDeviceListItem>(result);
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
    [devicesLimit, devicesPage, handleError, houseId, normalizeList, router, showToast, t]
  );

  useEffect(() => {
    if (activeTab !== 'devices') return;
    const controller = new AbortController();
    void loadDevices(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadDevices]);

  // Refresh list after closing "Add device" modal, since it can update houseId on a device.
  useEffect(() => {
    const prev = prevAddDeviceModalOpenRef.current;
    prevAddDeviceModalOpenRef.current = addDeviceModalOpen;
    if (activeTab !== 'devices') return;
    if (prev && !addDeviceModalOpen) {
      void loadDevices();
    }
  }, [addDeviceModalOpen, activeTab, loadDevices]);

  const devicesPages = Math.max(1, Math.ceil(devicesTotal / devicesLimit));

  const showLiveBadge = useMemo(
    () => telemetryEnabled && canSubscribe,
    [telemetryEnabled, canSubscribe]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t('admin.accessControl.connectedDevices.sectionTitle')}
          </h3>
          {showLiveBadge ? (
            isSocketConnected && isBridgeAvailable ? (
              <Badge variant="outline" className="border-emerald-500/50 text-[10px] text-emerald-600">
                {t('admin.accessControl.connectedDevices.telemetryLive')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                {t('admin.accessControl.connectedDevices.telemetryDisconnected')}
              </Badge>
            )
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <AppButton
              size="sm"
              onClick={() => houseId && openAddDeviceModal(houseId)}
              disabled={!houseId}
            >
              {t('admin.accessControl.addDevice.button')}
            </AppButton>
            <AppButton
              variant="secondary"
              size="sm"
              onClick={() => void loadDevices()}
              disabled={!houseId}
            >
              {t('admin.retry')}
            </AppButton>
          </div>
          <span className="text-xs text-muted-foreground">
            {t('admin.page')} {devicesPage} / {devicesPages}
          </span>
        </div>
        {!houseId ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t('admin.noData')}
          </div>
        ) : devicesLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : devicesError === 'forbidden' ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t('errors.unauthorized')}
          </div>
        ) : devicesError === 'error' ? (
          <div className="space-y-3 rounded-xl border border-border bg-card p-8 text-center">
            <span className="text-sm text-muted-foreground">{t('common.error')}</span>
            <AppButton variant="secondary" size="sm" onClick={() => void loadDevices()}>
              {t('admin.retry')}
            </AppButton>
          </div>
        ) : devices.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t('admin.noData')}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {houseId
              ? devices.map((device) => (
                  <DeviceListCard
                    key={device.id}
                    device={device}
                    houseId={houseId}
                    live={getLiveState(device)}
                    isSocketConnected={isSocketConnected}
                    locale={locale}
                    t={t}
                    onRemoved={(id) => setDevices((prev) => prev.filter((d) => d.id !== id))}
                  />
                ))
              : null}
          </div>
        )}

        {houseId && devicesPages > 1 ? (
          <div className="flex items-center justify-center gap-2">
            <AppButton
              size="sm"
              variant="secondary"
              disabled={devicesPage <= 1}
              onClick={() => setDevicesPage((prev) => Math.max(1, prev - 1))}
            >
              {t('admin.previous')}
            </AppButton>
            <span className="text-xs text-muted-foreground">
              {t('admin.page')} {devicesPage} / {devicesPages}
            </span>
            <AppButton
              size="sm"
              variant="secondary"
              disabled={devicesPage >= devicesPages}
              onClick={() => setDevicesPage((prev) => Math.min(devicesPages, prev + 1))}
            >
              {t('admin.next')}
            </AppButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}
