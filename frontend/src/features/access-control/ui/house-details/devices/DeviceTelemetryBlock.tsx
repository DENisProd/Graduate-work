'use client';

import { formatDateTime } from '@/lib/utils';
import type { ZigbeeStateWire } from '@/types/api';
import type { useTranslation } from '@/hooks';

type DevicesTabTranslate = ReturnType<typeof useTranslation>['t'];

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

export function DeviceTelemetryBlock({
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
