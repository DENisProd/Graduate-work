'use client';

import { formatDateTime } from '@/lib/utils';
import type { ZigbeeStateWire } from '@/types/api';
import type { useTranslation } from '@/hooks';

type DevicesTabTranslate = ReturnType<typeof useTranslation>['t'];

function payloadBool(payload: Record<string, unknown>, key: string): boolean | null {
  const v = payload[key];
  return typeof v === 'boolean' ? v : null;
}

function BatteryIcon({ level }: { level: number }) {
  const color = level > 50 ? 'var(--color-emerald-500, #22c55e)' : level > 20 ? 'var(--color-yellow-500, #eab308)' : 'var(--color-red-500, #ef4444)';
  const fillW = Math.max(0, Math.min(100, level));
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="15" height="9" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <rect x="16" y="3" width="2" height="4" rx="0.5" fill="currentColor" />
      <rect x="1.5" y="1.5" width={`${(fillW / 100) * 13}`} height="7" rx="1" fill={color} />
    </svg>
  );
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

  const tamper = payloadBool(payload, 'tamper');

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
    tamper !== null;

  const yesText = t('common.yes');
  const noText = t('common.no');

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
                {occupancy ? yesText : noText}
              </span>
            </>
          ) : null}
          {hasTemperature ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryTemp')}</span>
              <span className="text-right text-foreground">{temperature}°</span>
            </>
          ) : null}
          {hasHumidity ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryHumidity')}</span>
              <span className="text-right text-foreground">{humidity}%</span>
            </>
          ) : null}
          {hasBattery ? (
            <>
              <span className="flex items-center">
                <BatteryIcon level={battery} />
              </span>
              <span className="text-right text-foreground">{battery}%</span>
            </>
          ) : null}
          {hasColorMode ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryColorMode')}</span>
              <span className="text-right text-foreground">{colorModeStr}</span>
            </>
          ) : null}
          {tamper !== null ? (
            <>
              <span>{t('admin.accessControl.connectedDevices.telemetryTamper')}</span>
              <span className="text-right text-foreground">
                {tamper ? yesText : noText}
              </span>
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
