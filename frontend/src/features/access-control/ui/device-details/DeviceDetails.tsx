'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { ApiError, deviceDataApi, physicalDevicesApi } from '@/lib/api-client';
import type { DeviceDataResponse, PhysicalDeviceResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/app-button';
import { formatDateTime } from '@/lib/utils';

interface DeviceDetailsProps {
  houseId: number;
  deviceId: string;
}

type DeviceStatus = PhysicalDeviceResponse['status'];

type NumericPoint = {
  timestamp: Date;
  value: number;
};

function extractNumericValue(data: Record<string, unknown>): number | null {
  if (typeof data.value === 'number') return data.value;
  for (const v of Object.values(data)) {
    if (typeof v === 'number') return v;
  }
  return null;
}

function buildSeries(items: DeviceDataResponse[], deviceFunction: string | null): NumericPoint[] {
  const filtered = items.filter((item) => !deviceFunction || item.deviceFunction === deviceFunction);
  const points: NumericPoint[] = [];
  for (const item of filtered) {
    const value = extractNumericValue(item.data);
    if (value == null) continue;
    points.push({ timestamp: new Date(item.timestamp), value });
  }
  points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return points;
}

function DeviceValueChart({ points }: { points: NumericPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
        Недостаточно данных для графика
      </div>
    );
  }

  const width = 400;
  const height = 160;
  const padding = 12;

  const times = points.map((p) => p.timestamp.getTime());
  const values = points.map((p) => p.value);

  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const timeSpan = maxTime - minTime || 1;
  const valueSpan = maxValue - minValue || 1;

  const mapX = (t: number) =>
    padding + ((t - minTime) / timeSpan) * (width - padding * 2);
  const mapY = (v: number) =>
    height - padding - ((v - minValue) / valueSpan) * (height - padding * 2);

  const pathD = points
    .map((p, index) => {
      const x = mapX(p.timestamp.getTime());
      const y = mapY(p.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-40 w-full min-w-[260px]"
      >
        <defs>
          <linearGradient id="deviceValueGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={`${pathD} L ${mapX(maxTime)} ${height - padding} L ${mapX(minTime)} ${
            height - padding
          } Z`}
          fill="url(#deviceValueGradient)"
        />
      </svg>
    </div>
  );
}

export function DeviceDetails({ houseId, deviceId }: DeviceDetailsProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();

  const [device, setDevice] = useState<PhysicalDeviceResponse | null>(null);
  const [status, setStatus] = useState<DeviceStatus | undefined>(undefined);

  const [dataItems, setDataItems] = useState<DeviceDataResponse[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  const [deviceLoading, setDeviceLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<'none' | 'forbidden' | 'error'>('none');

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          showToast(t('common.unauthorized'), 'error');
          setError('error');
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
    [showToast, t]
  );

  useEffect(() => {
    const controller = new AbortController();
    setDeviceLoading(true);
    setError('none');
    physicalDevicesApi
      .getById(deviceId, { signal: controller.signal })
      .then((res) => {
        setDevice(res);
        setStatus(res.status);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        handleError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setDeviceLoading(false);
      });

    return () => controller.abort();
  }, [deviceId, handleError]);

  const loadData = useCallback(
    (signal?: AbortSignal) => {
      setDataLoading(true);
      setError('none');
      deviceDataApi
        .getAll({
          deviceId,
          page: 0,
          limit: 100,
          signal,
        })
        .then((res) => {
          if (signal?.aborted) return;
          setDataItems(res.items);
          if (!selectedFunction && res.items.length > 0) {
            setSelectedFunction(res.items[0].deviceFunction);
          }
        })
        .catch((err) => {
          if (signal?.aborted) return;
          handleError(err);
        })
        .finally(() => {
          if (!signal?.aborted) setDataLoading(false);
        });
    },
    [deviceId, handleError, selectedFunction]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const functions = useMemo(
    () => Array.from(new Set(dataItems.map((d) => d.deviceFunction))),
    [dataItems]
  );

  const latestForFunction = useMemo(() => {
    if (!selectedFunction) return null;
    const byFunction = dataItems
      .filter((d) => d.deviceFunction === selectedFunction)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return byFunction[0] ?? null;
  }, [dataItems, selectedFunction]);

  const series = useMemo(
    () => buildSeries(dataItems, selectedFunction),
    [dataItems, selectedFunction]
  );

  const events = useMemo(
    () =>
      dataItems
        .filter((d) => !selectedFunction || d.deviceFunction === selectedFunction)
        .slice(0, 20),
    [dataItems, selectedFunction]
  );

  const currentValueDisplay = useMemo(() => {
    if (!latestForFunction) return '—';
    const numeric = extractNumericValue(latestForFunction.data);
    if (numeric != null) return numeric.toString();
    return JSON.stringify(latestForFunction.data);
  }, [latestForFunction]);

  const statusBadgeVariant: 'secondary' | 'destructive' | 'outline' = useMemo(() => {
    if (status === 'ERROR') return 'destructive';
    if (status === 'ONLINE') return 'secondary';
    return 'outline';
  }, [status]);

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">
              {device?.name || t('admin.tabs.devices')}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {deviceLoading
                ? t('common.loading')
                : device
                  ? `ID: ${device.id} • ${t('admin.deviceType')}: ${device.deviceTypeId}`
                  : t('admin.noData')}
            </p>
          </div>
          {status && (
            <Badge variant={statusBadgeVariant}>
              {status === 'ONLINE'
                ? t('admin.status.online')
                : status === 'ERROR'
                  ? 'ERROR'
                  : t('admin.status.offline')}
            </Badge>
          )}
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border bg-card shadow-sm md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Текущее значение
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Функция</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={selectedFunction ?? ''}
                onChange={(e) =>
                  setSelectedFunction(e.target.value || null)
                }
              >
                {functions.length === 0 && (
                  <option value="">{t('admin.noData')}</option>
                )}
                {functions.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span>Значение</span>
              <span className="font-medium text-foreground">
                {currentValueDisplay}
                {latestForFunction?.unit ? ` ${latestForFunction.unit}` : ''}
              </span>
            </div>
            {latestForFunction && (
              <div className="flex items-center justify-between text-xs">
                <span>Обновлено</span>
                <span>
                  {formatDateTime(latestForFunction.timestamp, locale)}
                </span>
              </div>
            )}
            <AppButton
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
              onClick={() => loadData()}
              disabled={dataLoading}
            >
              {t('admin.retry')}
            </AppButton>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              График значений
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading && (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
              </div>
            )}
            {!dataLoading && <DeviceValueChart points={series} />}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            История срабатываний
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : events.length === 0 ? (
            <div className="py-4 text-sm text-muted-foreground">
              {t('admin.noData')}
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto text-xs">
              {events.map((event) => {
                const numeric = extractNumericValue(event.data);
                const value =
                  numeric != null ? numeric.toString() : JSON.stringify(event.data);
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                  >
                    <div className="mr-3 flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-foreground">
                        {event.deviceFunction}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {value}
                        {event.unit ? ` ${event.unit}` : ''}
                      </span>
                    </div>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(event.timestamp, locale)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

