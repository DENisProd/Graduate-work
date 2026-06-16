'use client';

import type { Device } from '@/domain/room-planner';
import type { PhysicalDeviceResponse, ZigbeeStateWire } from '@/types/api';
import { getDeviceStatusLines } from '../../lib/device-status-lines';
import { useTranslation } from '@/hooks';

const DEVICE_ICONS: Record<string, string> = {
  socket: '🔌',
  switch: '🔘',
  'motion-sensor': '👁️',
  'temperature-sensor': '🌡️',
  camera: '📹',
  dimmer: '💡',
};

const TONE_CLASS: Record<NonNullable<ReturnType<typeof getDeviceStatusLines>[number]['tone']>, string> = {
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
  const statusLines = showMetrics
    ? getDeviceStatusLines(device.type, physicalDevice, state, locale)
    : [];
  const icon = DEVICE_ICONS[device.type] || '📦';

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
        </div>
      </div>

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
    </div>
  );
}
