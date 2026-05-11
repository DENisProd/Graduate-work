'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks';
import { ServiceErrorCard, useToast } from '@/components/shared';
import { useAddDeviceModalStore } from '@/store/add-device-modal-store';
import type { HouseDetailsTab } from '@/store/access-control-store';
import { ApiError, deviceAuthApi, zigbeeDevicesApi } from '@/lib/api-client';
import type { ConnectedLocalServerItem } from '@/lib/api/access-service';
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
  const [devicesErrorDetails, setDevicesErrorDetails] = useState<string[] | null>(null);
  const [isBridgeAvailable, setIsBridgeAvailable] = useState(true);
  const [connectedServers, setConnectedServers] = useState<ConnectedLocalServerItem[]>([]);
  const [connectedServersLoading, setConnectedServersLoading] = useState(false);

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
        try {
          await zigbeeDevicesApi.requestSyncFromBridge(houseId, { signal });
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

  const loadConnectedServers = useCallback(async () => {
    setConnectedServersLoading(true);
    try {
      const data = await deviceAuthApi.listConnectedServers();
      setConnectedServers(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        return;
      }
      setConnectedServers([]);
    } finally {
      setConnectedServersLoading(false);
    }
  }, []);

  const handleLogoutLocalServer = useCallback(
    async (sessionId: string) => {
      try {
        await deviceAuthApi.logoutSession(sessionId);
        showToast('Local-server session logged out', 'success');
        await loadConnectedServers();
      } catch {
        showToast('Failed to logout local-server session', 'error');
      }
    },
    [loadConnectedServers, showToast]
  );

  const handleLogoutFrontend = useCallback(async () => {
    await signOut({ callbackUrl: '/device-auth' });
  }, []);

  useEffect(() => {
    if (activeTab !== 'devices') return;
    const controller = new AbortController();
    void loadDevices(controller.signal);
    void loadConnectedServers();
    return () => controller.abort();
  }, [activeTab, loadConnectedServers, loadDevices]);

  // Refresh list after closing "Add device" modal, since it can update houseId on a device.
  useEffect(() => {
    const prev = prevAddDeviceModalOpenRef.current;
    prevAddDeviceModalOpenRef.current = addDeviceModalOpen;
    if (activeTab !== 'devices') return;
    if (prev && !addDeviceModalOpen) {
      void loadDevices();
      void loadConnectedServers();
    }
  }, [addDeviceModalOpen, activeTab, loadConnectedServers, loadDevices]);

  const devicesPages = Math.max(1, Math.ceil(devicesTotal / devicesLimit));

  const showLiveBadge = useMemo(
    () => telemetryEnabled && canSubscribe,
    [telemetryEnabled, canSubscribe]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Connected local-server
            </h2>
            <div className="flex items-center gap-2">
              {connectedServersLoading ? (
                <span className="text-xs text-muted-foreground">Loading...</span>
              ) : null}
              <AppButton size="sm" variant="secondary" onClick={() => void handleLogoutFrontend()}>
                Logout frontend
              </AppButton>
            </div>
          </div>
          {connectedServers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No authorized local-server instances yet.</p>
          ) : (
            <div className="space-y-2">
              {connectedServers.map((server) => (
                <div key={server.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {server.displayName?.trim() || 'Local user'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        session {server.id.slice(0, 8)} · code {server.userCode}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {server.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <AppButton
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleLogoutLocalServer(server.id)}
                    >
                      Logout local-server
                    </AppButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-sm font-semibold text-foreground">
            {t('admin.accessControl.connectedDevices.sectionTitle')}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <AppButton
              size="sm"
              onClick={() => houseId && openAddDeviceModal(houseId)}
              disabled={!houseId}
            >
              {t('admin.accessControl.addDevice.button')}
            </AppButton>
          </div>
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
          <ServiceErrorCard
            title={locale === 'ru' ? 'Сервис устройств/сценариев недоступен' : 'Scenario/device service is unavailable'}
            description={
              locale === 'ru'
                ? 'Не удалось загрузить список устройств и/или телеметрию.'
                : 'Failed to load devices and/or telemetry.'
            }
            details={devicesErrorDetails ?? undefined}
            onRetry={() => void loadDevices()}
          />
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
