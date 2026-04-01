'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { useAddDeviceModalStore } from '@/store/add-device-modal-store';
import type { HouseDetailsTab } from '@/store/access-control-store';
import { ApiError, deviceDataApi, physicalDevicesApi } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import type { DeviceDataResponse, PhysicalDeviceResponse } from '@/types/api';

interface DevicesTabProps {
  houseId: string | null;
  activeTab: HouseDetailsTab;
}

export function DevicesTab({ houseId, activeTab }: DevicesTabProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const openAddDeviceModal = useAddDeviceModalStore((s) => s.open);

  const [devices, setDevices] = useState<PhysicalDeviceResponse[]>([]);
  const [devicesTotal, setDevicesTotal] = useState(0);
  const [devicesPage, setDevicesPage] = useState(1);
  const devicesLimit = 6;
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<'none' | 'forbidden' | 'error'>('none');

  const [dataItems, setDataItems] = useState<DeviceDataResponse[]>([]);
  const [dataTotal, setDataTotal] = useState(0);
  const [dataPage, setDataPage] = useState(1);
  const dataLimit = 6;
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<'none' | 'forbidden' | 'error'>('none');

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
          total: typeof obj.totalElements === 'number' ? obj.totalElements : (obj.content as T[]).length,
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
        const result = await physicalDevicesApi.getAll({
          houseId,
          page: devicesPage - 1,
          limit: devicesLimit,
          signal,
        });
        const normalized = normalizeList<PhysicalDeviceResponse>(result);
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
    [devicesLimit, devicesPage, handleError, houseId, normalizeList]
  );

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      if (!houseId) return;
      setDataLoading(true);
      setDataError('none');
      try {
        const result = await deviceDataApi.getAll({
          houseId,
          page: dataPage - 1,
          limit: dataLimit,
          signal,
        });
        const normalized = normalizeList<DeviceDataResponse>(result);
        if (signal?.aborted) return;
        setDataItems(normalized.items);
        setDataTotal(normalized.total);
      } catch (error) {
        if (signal?.aborted) return;
        handleError(error, setDataError);
      } finally {
        if (!signal?.aborted) setDataLoading(false);
      }
    },
    [dataLimit, dataPage, handleError, houseId, normalizeList]
  );

  useEffect(() => {
    if (activeTab !== 'devices') return;
    const controller = new AbortController();
    void loadDevices(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadDevices]);

  useEffect(() => {
    if (activeTab !== 'devices') return;
    const controller = new AbortController();
    void loadData(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadData]);

  const totalPages = (total: number, limit: number) => Math.max(1, Math.ceil(total / limit));


  const devicesPages = totalPages(devicesTotal, devicesLimit);
  const dataPages = totalPages(dataTotal, dataLimit);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <AppButton
              size="sm"
              onClick={() => houseId && openAddDeviceModal(houseId)}
              disabled={!houseId}
            >
              {t('admin.accessControl.addDevice.button')}
            </AppButton>
            <AppButton variant="secondary" size="sm" onClick={() => loadDevices()}>
              {t('admin.retry')}
            </AppButton>
          </div>
          <span className="text-xs text-muted-foreground">
            {t('admin.page')} {devicesPage} / {devicesPages}
          </span>
        </div>
        {devicesLoading ? (
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
            <AppButton variant="secondary" size="sm" onClick={() => loadDevices()}>
              {t('admin.retry')}
            </AppButton>
          </div>
        ) : devices.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t('admin.noData')}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <Card
                key={device.id}
                className="border border-border bg-card shadow-sm cursor-pointer transition hover:border-accent"
                onClick={() => houseId && router.push(`/admin/access-control/houses/${houseId}/devices/${device.id}`)}
              >
                <CardHeader className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{device.name}</CardTitle>
                  {device.status && (
                    <Badge
                      variant={
                        device.status === 'ERROR'
                          ? 'destructive'
                          : device.status === 'ONLINE'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {device.status === 'ONLINE'
                        ? t('admin.status.online')
                        : device.status === 'ERROR'
                          ? 'ERROR'
                          : t('admin.status.offline')}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    {t('admin.deviceType')}: {device.deviceTypeId}
                  </div>
                  <div>
                    {t('admin.serialNumber')}: {device.serialNumber || '—'}
                  </div>
                  <div>
                    {t('admin.firmwareVersion')}: {device.firmwareVersion || '—'}
                  </div>
                  <div>
                    {t('admin.room')}: {device.roomId || '—'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {devicesPages > 1 && (
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
        )}
      </div>
      <div className="space-y-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {t('admin.accessControl.dataAnalysis')}
          </h3>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <AppButton variant="secondary" size="sm" onClick={() => loadData()}>
            {t('admin.retry')}
          </AppButton>
          <span className="text-xs text-muted-foreground">
            {t('admin.page')} {dataPage} / {dataPages}
          </span>
        </div>
        {dataLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : dataError === 'forbidden' ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t('errors.unauthorized')}
          </div>
        ) : dataError === 'error' ? (
          <div className="space-y-3 rounded-xl border border-border bg-card p-8 text-center">
            <span className="text-sm text-muted-foreground">{t('common.error')}</span>
            <AppButton variant="secondary" size="sm" onClick={() => loadData()}>
              {t('admin.retry')}
            </AppButton>
          </div>
        ) : dataItems.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t('admin.noData')}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {dataItems.map((item) => (
              <Card key={item.id} className="border border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">{item.deviceFunction}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {item.type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    {t('admin.deviceType')}: {item.deviceTypeId}
                  </div>
                  <div>
                    {t('admin.unit')}: {item.unit || '—'}
                  </div>
                  <div>{formatDateTime(item.timestamp, locale)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {dataPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <AppButton
              size="sm"
              variant="secondary"
              disabled={dataPage <= 1}
              onClick={() => setDataPage((prev) => Math.max(1, prev - 1))}
            >
              {t('admin.previous')}
            </AppButton>
            <span className="text-xs text-muted-foreground">
              {t('admin.page')} {dataPage} / {dataPages}
            </span>
            <AppButton
              size="sm"
              variant="secondary"
              disabled={dataPage >= dataPages}
              onClick={() => setDataPage((prev) => Math.min(dataPages, prev + 1))}
            >
              {t('admin.next')}
            </AppButton>
          </div>
        )}
      </div>
    </div>
  );
}
