'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { ApiError, physicalDevicesApi } from '@/lib/api-client';
import type { PhysicalDeviceResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/app-button';

interface DeviceDetailsProps {
  houseId: string;
  deviceId: string;
}

function displayName(device: PhysicalDeviceResponse | null): string {
  if (!device) return '';
  const n = device.friendlyName || device.name || device.protocolAddress || device.id;
  return typeof n === 'string' ? n : String(n);
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function OverviewField({ label, value }: { label: string; value: unknown }) {
  const text =
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
      ? formatScalar(value)
      : value === null || value === undefined
        ? '—'
        : JSON.stringify(value);
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border py-2 last:border-b-0 sm:grid-cols-[minmax(10rem,14rem)_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words font-mono text-sm text-foreground">{text}</dd>
    </div>
  );
}

export function DeviceDetails({ houseId, deviceId }: DeviceDetailsProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const [device, setDevice] = useState<PhysicalDeviceResponse | null>(null);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [error, setError] = useState<'none' | 'forbidden' | 'error'>('none');

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push('/login');
          return;
        }
        if (err.status === 403) {
          showToast(t('errors.unauthorized'), 'error');
          setError('forbidden');
          return;
        }
        if (err.status >= 500) {
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

  const loadDevice = useCallback(
    async (signal?: AbortSignal) => {
      setDeviceLoading(true);
      setError('none');
      try {
        const res = await physicalDevicesApi.getById(deviceId, { signal });
        if (signal?.aborted) return;
        setDevice(res);
      } catch (err) {
        if (signal?.aborted) return;
        handleError(err);
      } finally {
        if (!signal?.aborted) setDeviceLoading(false);
      }
    },
    [deviceId, handleError]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDevice(controller.signal);
    return () => controller.abort();
  }, [loadDevice]);

  const definitionJson = useMemo(() => {
    if (!device?.definition) return '';
    try {
      return JSON.stringify(device.definition, null, 2);
    } catch {
      return String(device.definition);
    }
  }, [device]);

  const fullDeviceJson = useMemo(() => {
    if (!device) return '';
    try {
      return JSON.stringify(device, null, 2);
    } catch {
      return '';
    }
  }, [device]);

  const status = device?.status;
  const statusBadgeVariant: 'secondary' | 'destructive' | 'outline' = useMemo(() => {
    if (status === 'ERROR') return 'destructive';
    if (status === 'ONLINE') return 'secondary';
    return 'outline';
  }, [status]);

  const backHref = `/admin/access-control/houses/${houseId}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <AppButton variant="secondary" size="sm" onClick={() => router.push(backHref)}>
          {t('common.back')} — {t('admin.accessControl.connectedDevices.backToDevices')}
        </AppButton>
        <AppButton variant="secondary" size="sm" onClick={() => void loadDevice()} disabled={deviceLoading}>
          {t('admin.retry')}
        </AppButton>
      </div>

      {error === 'forbidden' ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('errors.unauthorized')}
        </div>
      ) : error === 'error' && !device ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-8 text-center">
          <span className="text-sm text-muted-foreground">{t('common.error')}</span>
        </div>
      ) : null}

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="min-w-0">
            <CardTitle className="text-lg">
              {deviceLoading && !device
                ? t('common.loading')
                : displayName(device) || t('admin.accessControl.connectedDevices.deviceOverviewTitle')}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('admin.accessControl.connectedDevices.deviceOverviewTitle')} · ID: {deviceId}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {device?.protocolAddress ? (
              <Badge variant="secondary">{t('admin.accessControl.connectedDevices.protocolZigbee')}</Badge>
            ) : null}
            {device?.type ? (
              <Badge variant="outline">{device.type}</Badge>
            ) : null}
            {status ? (
              <Badge variant={statusBadgeVariant}>
                {status === 'ONLINE'
                  ? t('admin.status.online')
                  : status === 'ERROR'
                    ? 'ERROR'
                    : t('admin.status.offline')}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {device && !deviceLoading ? (
        <>
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                {t('admin.accessControl.connectedDevices.scalarFields')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <OverviewField label="id" value={device.id} />
                <OverviewField label="protocolAddress (IEEE)" value={device.protocolAddress} />
                <OverviewField label="networkAddress" value={device.networkAddress} />
                <OverviewField label="friendlyName" value={device.friendlyName} />
                <OverviewField label="name" value={device.name} />
                <OverviewField label="type" value={device.type} />
                <OverviewField label="model" value={device.model} />
                <OverviewField label="manufacturerName" value={device.manufacturerName} />
                <OverviewField label="description" value={device.description} />
                <OverviewField label="deviceTypeId" value={device.deviceTypeId} />
                <OverviewField label="houseId" value={device.houseId} />
                <OverviewField label="roomId" value={device.roomId} />
                <OverviewField label="deviceId" value={device.deviceId} />
                <OverviewField label="firmwareVersion" value={device.firmwareVersion} />
                <OverviewField label="serialNumber" value={device.serialNumber} />
                <OverviewField label="ipAddress" value={device.ipAddress} />
                <OverviewField label="macAddress" value={device.macAddress} />
                <OverviewField label="lastSeen" value={device.lastSeen} />
                <OverviewField label="createdAt" value={device.createdAt} />
                <OverviewField label="updatedAt" value={device.updatedAt} />
              </dl>
            </CardContent>
          </Card>

          {device.capabilities && device.capabilities.length > 0 ? (
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  {t('admin.accessControl.connectedDevices.capabilities')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {device.capabilities.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs font-normal">
                      {c}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {definitionJson ? (
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  {t('admin.accessControl.connectedDevices.definitionJsonTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[min(70vh,36rem)] overflow-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed">
                  {definitionJson}
                </pre>
              </CardContent>
            </Card>
          ) : null}

          {fullDeviceJson ? (
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  {t('admin.accessControl.connectedDevices.fullDeviceJsonTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[min(70vh,36rem)] overflow-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed">
                  {fullDeviceJson}
                </pre>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : deviceLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : null}
    </div>
  );
}
