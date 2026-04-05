'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { useAddDeviceModalStore } from '@/store/add-device-modal-store';
import type { HouseDetailsTab } from '@/store/access-control-store';
import { ApiError, zigbeeDevicesApi } from '@/lib/api-client';
import { cn, formatDateTime } from '@/lib/utils';
import type { ZigbeeDeviceListItem, ZigbeeStateWire } from '@/types/api';
import { useZigbeeTelemetry } from '@/features/access-control/hooks/useZigbeeTelemetry';
import {
  isZigbeeDevice,
  zigbeeDisplayName,
} from '@/features/access-control/lib/zigbee-device-utils';

interface DevicesTabProps {
  houseId: string | null;
  activeTab: HouseDetailsTab;
}

function zigbeeModel(device: ZigbeeDeviceListItem): string | null {
  return device.modelId ?? device.model ?? null;
}

function definitionStringField(
  definition: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  if (!definition || typeof definition !== 'object') return null;
  const v = definition[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

const CAP_PREVIEW = 8;

function formatPresentMetric(value: string | number | boolean): string {
  if (typeof value === 'boolean') return value ? 'ON' : 'OFF';
  return String(value);
}

function payloadNumber(payload: Record<string, unknown>, key: string): number | null {
  const v = payload[key];
  return typeof v === 'number' && !Number.isNaN(v) ? v : null;
}

function payloadBool(payload: Record<string, unknown>, key: string): boolean | null {
  const v = payload[key];
  return typeof v === 'boolean' ? v : null;
}

type DevicesTabTranslate = ReturnType<typeof useTranslation>['t'];

function telemetryChangeSignature(live: ZigbeeStateWire | undefined): string {
  if (!live) return '';
  if (live.stateId) return `${live.stateId}:${live.timestamp}`;
  return `${live.timestamp}:${JSON.stringify(live.metrics)}`;
}

/** MQTT часто шлёт пачки сообщений; без debounce каждое сбрасывало бы анимацию через ~100 ms. */
const TELEMETRY_PULSE_DEBOUNCE_MS = 180;

/**
 * Счётчик импульсов при смене телеметрии. Debounce + стабильный DOM + WAAPI дают полные 2 s вспышки.
 */
function useTelemetryPulseKey(live: ZigbeeStateWire | undefined): number {
  const [pulseKey, setPulseKey] = useState(0);
  const prevSigRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const sig = telemetryChangeSignature(live);

    if (prevSigRef.current === null) {
      prevSigRef.current = sig;
      return;
    }

    if (sig !== prevSigRef.current && sig !== '') {
      prevSigRef.current = sig;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        setPulseKey((k) => k + 1);
      }, TELEMETRY_PULSE_DEBOUNCE_MS);
      return;
    }

    prevSigRef.current = sig;
  }, [live]);

  return pulseKey;
}

const TELEMETRY_FLASH_MS = 2000;

/** Отдельно от CSS: частые zigbee:state не должны обрывать длину анимации. */
function TelemetryFlashOverlay({ pulseKey }: { pulseKey: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (pulseKey === 0) return;
    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;
    const accent = getComputedStyle(root).getPropertyValue('--accent').trim();
    if (!accent) return;

    el.getAnimations().forEach((a) => a.cancel());

    const ring = `inset 0 0 0 2px ${accent}, 0 0 0 2px ${accent}`;
    const glowStrong = `${ring}, 0 0 36px 10px ${accent}`;
    const glowSoft = `${ring}, 0 0 24px 6px ${accent}`;

    const anim = el.animate(
      [
        { opacity: 0, boxShadow: 'inset 0 0 0 0 transparent, 0 0 0 0 transparent' },
        { opacity: 1, boxShadow: glowStrong, offset: 0.1 },
        { opacity: 1, boxShadow: glowSoft, offset: 0.72 },
        { opacity: 0, boxShadow: 'inset 0 0 0 0 transparent, 0 0 0 0 transparent' },
      ],
      {
        duration: TELEMETRY_FLASH_MS,
        easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
        fill: 'forwards',
      }
    );

    return () => anim.cancel();
  }, [pulseKey]);

  if (pulseKey === 0) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-10 rounded-xl"
      style={{ willChange: 'opacity, box-shadow' }}
      aria-hidden
    />
  );
}

function DeviceTelemetryBlock({
  live,
  socketConnected,
  t,
  locale,
}: {
  live: ZigbeeStateWire | undefined;
  socketConnected: boolean;
  t: DevicesTabTranslate;
  locale: string;
}) {
  const m = live?.metrics;
  const payload = live?.payload ?? {};

  const voltage = payloadNumber(payload, 'voltage');
  const tamper = payloadBool(payload, 'tamper');

  const lq = m?.linkquality;
  const hasLq = typeof lq === 'number' && !Number.isNaN(lq);
  const lqPct = hasLq ? Math.min(100, Math.round((lq / 255) * 100)) : 0;

  const stateStr = m?.state;
  const hasState = typeof stateStr === 'string' && stateStr.trim().length > 0;

  const brightness = m?.brightness;
  const hasBrightness = typeof brightness === 'number' && !Number.isNaN(brightness);

  const occupancy = m?.occupancy;
  const hasOccupancy = typeof occupancy === 'boolean';

  const temperature = m?.temperature;
  const hasTemperature = typeof temperature === 'number' && !Number.isNaN(temperature);

  const humidity = m?.humidity;
  const hasHumidity = typeof humidity === 'number' && !Number.isNaN(humidity);

  const battery = m?.battery;
  const hasBattery = typeof battery === 'number' && !Number.isNaN(battery);

  const colorModeStr = m?.colorMode;
  const hasColorMode = typeof colorModeStr === 'string' && colorModeStr.trim().length > 0;

  const hasMetricGrid =
    hasState ||
    hasBrightness ||
    hasOccupancy ||
    hasTemperature ||
    hasHumidity ||
    hasBattery ||
    hasColorMode ||
    voltage !== null ||
    tamper !== null;

  return (
    <div className="space-y-2 border-t border-border pt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">
          {t('admin.accessControl.connectedDevices.telemetryNow')}
        </span>
        {!socketConnected ? (
          <span className="text-[10px] text-muted-foreground">
            {t('admin.accessControl.connectedDevices.telemetryDisconnected')}
          </span>
        ) : null}
      </div>
      {hasLq ? (
        <div className="space-y-0.5">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{t('admin.accessControl.connectedDevices.telemetryLink')}</span>
            <span>{lq}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500/80 transition-all"
              style={{ width: `${lqPct}%` }}
            />
          </div>
        </div>
      ) : null}
      {hasMetricGrid ? (
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          {hasState ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryState')}</span>
              <span className="text-right text-foreground">{stateStr}</span>
            </>
          ) : null}
          {hasBrightness ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryBrightness')}</span>
              <span className="text-right text-foreground">{brightness}</span>
            </>
          ) : null}
          {hasOccupancy ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryOccupancy')}</span>
              <span className="text-right text-foreground">
                {formatPresentMetric(occupancy)}
              </span>
            </>
          ) : null}
          {hasTemperature ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryTemp')}</span>
              <span className="text-right text-foreground">{temperature}</span>
            </>
          ) : null}
          {hasHumidity ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryHumidity')}</span>
              <span className="text-right text-foreground">{humidity}</span>
            </>
          ) : null}
          {hasBattery ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryBattery')}</span>
              <span className="text-right text-foreground">{battery}</span>
            </>
          ) : null}
          {hasColorMode ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryColorMode')}</span>
              <span className="text-right text-foreground">{colorModeStr}</span>
            </>
          ) : null}
          {voltage !== null ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryVoltage')}</span>
              <span className="text-right text-foreground">{voltage}</span>
            </>
          ) : null}
          {tamper !== null ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryTamper')}</span>
              <span className="text-right text-foreground">{formatPresentMetric(tamper)}</span>
            </>
          ) : null}
        </div>
      ) : null}
      {live?.timestamp ? (
        <div className="text-[10px] text-muted-foreground">
          {formatDateTime(live.timestamp, locale)}
        </div>
      ) : null}
    </div>
  );
}

function HouseDeviceListCard({
  device,
  houseId,
  live,
  isSocketConnected,
  locale,
  t,
}: {
  device: ZigbeeDeviceListItem;
  houseId: string;
  live: ZigbeeStateWire | undefined;
  isSocketConnected: boolean;
  locale: string;
  t: DevicesTabTranslate;
}) {
  const router = useRouter();
  const telemetryPulseKey = useTelemetryPulseKey(live);

  const model = zigbeeModel(device);
  const vendor =
    definitionStringField(device.definition, 'vendor') ?? device.manufacturerName ?? null;
  const defDescription = definitionStringField(device.definition, 'description');
  const caps = device.capabilities ?? [];
  const preview = caps.slice(0, CAP_PREVIEW);
  const more = Math.max(0, caps.length - preview.length);
  const showTelemetry = isZigbeeDevice(device) || Boolean(live);

  return (
    <Card
      className={cn(
        'relative cursor-pointer border border-border bg-card shadow-sm transition hover:border-accent'
      )}
      onClick={() => router.push(`/admin/access-control/houses/${houseId}/devices/${device.id}`)}
    >
      <TelemetryFlashOverlay pulseKey={telemetryPulseKey} />
      <CardHeader className="relative z-[1] flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{zigbeeDisplayName(device)}</CardTitle>
          {defDescription ? (
            <CardDescription className="line-clamp-2 text-xs">{defDescription}</CardDescription>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {isZigbeeDevice(device) ? (
            <Badge variant="secondary" className="text-xs">
              {t('admin.accessControl.connectedDevices.protocolZigbee')}
            </Badge>
          ) : null}
          {device.type ? (
            <Badge
              variant="outline"
              className="text-xs"
              title={t('admin.accessControl.connectedDevices.deviceRole')}
            >
              {device.type}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="relative z-[1] space-y-2 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {model ? (
            <span>
              {t('admin.accessControl.connectedDevices.model')}: {model}
            </span>
          ) : null}
          {vendor ? (
            <span>
              {t('admin.accessControl.connectedDevices.vendor')}: {vendor}
            </span>
          ) : null}
        </div>
        {device.lastSeen ? (
          <div>
            {t('admin.accessControl.connectedDevices.lastSeen')}:{' '}
            {formatDateTime(device.lastSeen, locale)}
          </div>
        ) : null}
        {showTelemetry ? (
          <DeviceTelemetryBlock
            live={live}
            socketConnected={isSocketConnected}
            t={t}
            locale={locale}
          />
        ) : null}
        {preview.length > 0 ? (
          <div className="space-y-1">
            <div className="text-xs font-medium text-foreground">
              {t('admin.accessControl.connectedDevices.capabilities')}
            </div>
            <div className="flex flex-wrap gap-1">
              {preview.map((c) => (
                <Badge key={c} variant="secondary" className="text-[10px] font-normal">
                  {c}
                </Badge>
              ))}
              {more > 0 ? (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {t('admin.accessControl.connectedDevices.moreCapabilities', { count: more })}
                </Badge>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DevicesTab({ houseId, activeTab }: DevicesTabProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const openAddDeviceModal = useAddDeviceModalStore((s) => s.open);

  const [devices, setDevices] = useState<ZigbeeDeviceListItem[]>([]);
  const [devicesTotal, setDevicesTotal] = useState(0);
  const [devicesPage, setDevicesPage] = useState(1);
  const devicesLimit = 12;
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<'none' | 'forbidden' | 'error'>('none');
  const [syncLoading, setSyncLoading] = useState(false);

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
    [devicesLimit, devicesPage, handleError, houseId, normalizeList]
  );

  const handleSyncFromBridge = useCallback(async () => {
    setSyncLoading(true);
    try {
      const res = await zigbeeDevicesApi.requestSyncFromBridge();
      if (res?.ok) {
        showToast(t('admin.accessControl.connectedDevices.syncRequested'), 'success');
        void loadDevices();
      }
    } catch (error) {
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
          showToast(t('admin.accessControl.connectedDevices.syncUnavailable'), 'error');
          return;
        }
      }
      showToast(t('common.error'), 'error');
    } finally {
      setSyncLoading(false);
    }
  }, [loadDevices, router, showToast, t]);

  useEffect(() => {
    if (activeTab !== 'devices') return;
    const controller = new AbortController();
    void loadDevices(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadDevices]);

  const totalPages = (total: number, limit: number) => Math.max(1, Math.ceil(total / limit));

  const devicesPages = totalPages(devicesTotal, devicesLimit);

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
            isSocketConnected ? (
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
              onClick={() => void handleSyncFromBridge()}
              disabled={!houseId || syncLoading}
            >
              {syncLoading
                ? t('admin.accessControl.scenarioEditor.loading')
                : t('admin.accessControl.connectedDevices.syncFromBridge')}
            </AppButton>
            <AppButton variant="secondary" size="sm" onClick={() => void loadDevices()} disabled={!houseId}>
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
                  <HouseDeviceListCard
                    key={device.id}
                    device={device}
                    houseId={houseId}
                    live={getLiveState(device)}
                    isSocketConnected={isSocketConnected}
                    locale={locale}
                    t={t}
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
