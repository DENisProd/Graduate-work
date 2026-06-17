'use client';

import type { Device } from '@/domain/room-planner';
import type { PhysicalDeviceResponse, ZigbeeStateWire } from '@/types/api';
import {
  getDeviceMetricEntries,
  getDeviceStatusLines,
} from '../../lib/device-status-lines';
import { connectivityFromLastOnline, connectivityLabel } from '@/lib/device-connectivity';
import { formatDateTime } from '@/lib/utils';
import { useTranslation } from '@/hooks';

const DEVICE_ICONS: Record<string, string> = {
  socket: '🔌',
  switch: '🔘',
  'motion-sensor': '👁️',
  'temperature-sensor': '🌡️',
  camera: '📹',
  dimmer: '💡',
};

const TONE_CLASS: Record<
  NonNullable<ReturnType<typeof getDeviceStatusLines>[number]['tone']>,
  string
> = {
  ok: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  muted: 'text-muted-foreground',
  danger: 'text-red-600 dark:text-red-400',
};

interface Props {
  device: Device;
  physicalDevice?: PhysicalDeviceResponse;
  state?: ZigbeeStateWire;
  showMetrics: boolean;
}

export function FloorPlanDevicePanel({ device, physicalDevice, state, showMetrics }: Props) {
  const { t, locale } = useTranslation();
  const name =
    physicalDevice?.friendlyName ||
    physicalDevice?.name ||
    (device.metadata?.label as string | undefined) ||
    (device.metadata?.name as string | undefined) ||
    t('dashboard.overview.widgets.floorPlanDeviceFallback');
  const description = physicalDevice?.description?.trim();
  const icon = DEVICE_ICONS[device.type] || '📦';

  const lastOnline = state?.timestamp ?? physicalDevice?.lastSeen ?? null;
  const connectivity = connectivityFromLastOnline(lastOnline);
  const connectivityText = connectivityLabel(connectivity, locale);

  const statusLines = showMetrics
    ? getDeviceStatusLines(device.type, physicalDevice, state, locale).slice(1)
    : [];
  const metricEntries = showMetrics
    ? getDeviceMetricEntries(state, (key) => t(key as Parameters<typeof t>[0]))
    : [];
  const lastUpdate = lastOnline ? formatDateTime(lastOnline, locale) : null;

  const fallbackLines: string[] = [];
  if (showMetrics && metricEntries.length === 0 && statusLines.length === 0) {
    if (physicalDevice?.model) {
      fallbackLines.push(`${t('dashboard.overview.widgets.floorPlanModel')}: ${physicalDevice.model}`);
    }
    if (physicalDevice?.firmwareVersion) {
      fallbackLines.push(
        `${t('dashboard.overview.widgets.floorPlanFirmware')}: ${physicalDevice.firmwareVersion}`,
      );
    }
  }

  return (
    <div className="flex h-full flex-col justify-center gap-4 border-l border-border bg-card/80 px-5 py-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-foreground break-words">
            {name}
          </h3>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground break-words">
              {description}
            </p>
          )}
          {showMetrics && (
            <p
              className={`mt-2 text-sm font-medium ${
                connectivity === 'ONLINE'
                  ? TONE_CLASS.ok
                  : connectivity === 'UNKNOWN'
                    ? TONE_CLASS.warn
                    : TONE_CLASS.muted
              }`}
            >
              {connectivityText}
            </p>
          )}
        </div>
      </div>

      {showMetrics && metricEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('dashboard.overview.widgets.floorPlanMetricsTitle')}
          </p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
            {metricEntries.map((entry) => (
              <div key={entry.label} className="contents">
                <dt className="text-xs text-muted-foreground">{entry.label}</dt>
                <dd className="text-right text-sm font-medium text-foreground">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {showMetrics && statusLines.length > 0 && (
        <ul className="space-y-2">
          {statusLines.map((line) => (
            <li
              key={`${line.text}-${line.tone ?? 'default'}`}
              className={`text-sm font-medium ${line.tone ? TONE_CLASS[line.tone] : 'text-muted-foreground'}`}
            >
              {line.text}
            </li>
          ))}
        </ul>
      )}

      {showMetrics && fallbackLines.length > 0 && (
        <ul className="space-y-1">
          {fallbackLines.map((line) => (
            <li key={line} className="text-xs text-muted-foreground">
              {line}
            </li>
          ))}
        </ul>
      )}

      {showMetrics && lastUpdate && (
        <p className="text-[11px] text-muted-foreground">
          {t('dashboard.overview.widgets.floorPlanLastUpdate')}: {lastUpdate}
        </p>
      )}
    </div>
  );
}
