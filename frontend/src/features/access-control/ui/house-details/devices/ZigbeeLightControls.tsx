'use client';

import type { MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ZigbeeDeviceListItem, ZigbeeStateWire } from '@/types/api';
import {
  hasZigbeeColorCapability,
  hexToHs,
  hsToHex,
  readZigbeeColor,
  zigbeeColorCommand,
} from '@/features/access-control/lib/zigbee-color';
import { deviceCapabilitySet } from '@/features/access-control/lib/zigbee-device-utils';

interface ZigbeeLightControlsProps {
  device: ZigbeeDeviceListItem;
  live?: ZigbeeStateWire;
  disabled?: boolean;
  onCommand: (payload: Record<string, unknown>) => Promise<{ ok: boolean }>;
}

function stopCardNav(e: MouseEvent) {
  e.stopPropagation();
}

export function ZigbeeLightControls({
  device,
  live,
  disabled = false,
  onCommand,
}: ZigbeeLightControlsProps) {
  const { t } = useTranslation();
  const caps = useMemo(() => deviceCapabilitySet(device), [device]);

  const hasBrightness =
    caps.has('brightness') || typeof live?.metrics?.brightness === 'number';
  const hasColorTemp =
    caps.has('color_temp') || caps.has('color_temp_percent') || live?.payload?.color_temp != null;
  const hasColor = hasZigbeeColorCapability(caps);

  const payload = live?.payload ?? {};
  const brightness =
    typeof live?.metrics?.brightness === 'number'
      ? live.metrics.brightness
      : typeof payload.brightness === 'number'
        ? payload.brightness
        : 0;
  const colorTemp =
    typeof payload.color_temp === 'number'
      ? payload.color_temp
      : typeof live?.metrics?.colorMode === 'string'
        ? 250
        : 250;

  const { hue, saturation } = readZigbeeColor(payload);
  const displayHex = hsToHex(hue, saturation);
  const [colorHex, setColorHex] = useState(displayHex);

  useEffect(() => {
    setColorHex(displayHex);
  }, [displayHex]);

  if (!hasBrightness && !hasColorTemp && !hasColor) return null;

  return (
    <div
      className="space-y-2.5 border-t border-border pt-2"
      onClick={stopCardNav}
      onPointerDown={stopCardNav}
    >
      {hasBrightness ? (
        <label className="block space-y-1">
          <span className="flex justify-between text-[11px] text-muted-foreground">
            <span>{t('admin.accessControl.connectedDevices.controlBrightness')}</span>
            <span>{Math.round((brightness / 254) * 100)}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={254}
            value={brightness}
            disabled={disabled}
            className="w-full accent-emerald-600"
            onChange={(e) => {
              const value = Number(e.target.value);
              void onCommand({ brightness: value });
            }}
          />
        </label>
      ) : null}

      {hasColor ? (
        <label className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground">
            {t('admin.accessControl.connectedDevices.controlColor')}
          </span>
          <input
            type="color"
            value={colorHex}
            disabled={disabled}
            className={cn(
              'h-9 w-14 cursor-pointer rounded border border-border bg-transparent p-0.5',
              disabled && 'cursor-not-allowed opacity-40',
            )}
            onChange={(e) => setColorHex(e.target.value)}
            onPointerUp={(e) => {
              const next = hexToHs((e.target as HTMLInputElement).value);
              void onCommand(zigbeeColorCommand(next.hue, next.saturation));
            }}
          />
        </label>
      ) : null}

      {hasColorTemp ? (
        <label className="block space-y-1">
          <span className="flex justify-between text-[11px] text-muted-foreground">
            <span>{t('admin.accessControl.connectedDevices.controlColorTemp')}</span>
            <span>{colorTemp} mired</span>
          </span>
          <input
            type="range"
            min={153}
            max={500}
            value={colorTemp}
            disabled={disabled}
            className="w-full accent-amber-500"
            onPointerUp={(e) => {
              void onCommand({ color_temp: Number((e.target as HTMLInputElement).value) });
            }}
            onChange={(e) => {
              void onCommand({ color_temp: Number(e.target.value) });
            }}
          />
        </label>
      ) : null}
    </div>
  );
}
