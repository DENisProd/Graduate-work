'use client';

import { useState } from 'react';
import type { DeviceHeroConfig, DeviceHeroStat } from '../../types/widget.types';
import type { PhysicalDeviceResponse, ZigbeeStateWire } from '@/types/api';
import type { ZigbeeCommandAck } from '@/features/access-control/lib/zigbee-telemetry-manager';
import { readPayloadValue } from '../../lib/useWidgetTelemetry';

interface Props {
  config: DeviceHeroConfig;
  device?: PhysicalDeviceResponse;
  state?: ZigbeeStateWire;
  onCommand: (
    device: { deviceIeeeAddr?: string; physicalDeviceId?: string },
    payload: Record<string, unknown>,
  ) => Promise<ZigbeeCommandAck>;
}

const ACCENT_BG: Record<DeviceHeroConfig['accent'], string> = {
  green: 'from-emerald-50 to-emerald-100/40 dark:from-emerald-900/20 dark:to-emerald-900/5',
  blue: 'from-sky-50 to-sky-100/40 dark:from-sky-900/20 dark:to-sky-900/5',
  amber: 'from-amber-50 to-amber-100/40 dark:from-amber-900/20 dark:to-amber-900/5',
  slate: 'from-slate-50 to-slate-100/40 dark:from-slate-800/40 dark:to-slate-800/10',
};

const ACCENT_CHIP: Record<DeviceHeroConfig['accent'], string> = {
  green: 'bg-emerald-100/80 text-emerald-800',
  blue: 'bg-sky-100/80 text-sky-800',
  amber: 'bg-amber-100/80 text-amber-800',
  slate: 'bg-slate-200/80 text-slate-700',
};

const ACCENT_ICON: Record<DeviceHeroConfig['accent'], string> = {
  green: 'bg-emerald-500/15 text-emerald-700',
  blue: 'bg-sky-500/15 text-sky-700',
  amber: 'bg-amber-500/20 text-amber-700',
  slate: 'bg-slate-500/15 text-slate-700',
};

const HERO_ICON: Record<DeviceHeroConfig['icon'], React.ReactNode> = {
  camera: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.823-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.823 1.316ZM16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
    />
  ),
  lightbulb: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
    />
  ),
  fan: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
    />
  ),
  lock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
    />
  ),
  speaker: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
    />
  ),
  sparkles: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 0 0-3.09 3.09Z"
    />
  ),
  thermometer: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 6.75v9.75a3 3 0 1 0 4.5 0V6.75a2.25 2.25 0 0 0-4.5 0Z"
    />
  ),
  broom: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m20 4-7 7m0 0H7l-3 9h12l-3-9m-2-2 2-2m-7 7 4 4"
    />
  ),
};

const STAT_ICON: Record<DeviceHeroStat['icon'], React.ReactNode> = {
  cube: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 7.5l-9-5.25L3 7.5m18 0-9 5.25M21 7.5v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
    />
  ),
  bolt: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
    />
  ),
  clock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  ),
  droplet: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a8.25 8.25 0 0 0 8.25-8.25c0-3.05-2.4-5.95-4.95-9.55-1.65-2.33-1.65-2.45-3.3-2.45s-1.65.13-3.3 2.45C6.15 6.8 3.75 9.7 3.75 12.75A8.25 8.25 0 0 0 12 21Z"
    />
  ),
  flame: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
    />
  ),
  leaf: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 13.5 10.5 6.75l3-3 7.5 7.5-3 3-6.75 6.75-7.5-7.5Z"
    />
  ),
};

function isOnFromState(state: ZigbeeStateWire | undefined, key: string | undefined): boolean {
  if (!state || !key) return false;
  const v = readPayloadValue(state, key);
  if (v === true) return true;
  if (typeof v === 'string') return ['on', 'open', 'true', 'active'].includes(v.toLowerCase());
  if (typeof v === 'number') return v > 0;
  return false;
}

function readNumeric(state: ZigbeeStateWire | undefined, key: string): number | null {
  if (!state) return null;
  const v = readPayloadValue(state, key);
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export function DeviceHeroWidget({ config, device, state, onCommand }: Props) {
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const live = isOnFromState(state, config.togglePayloadKey);
  const isOn = optimistic !== null ? optimistic : live;

  const subtitle = config.subtitle || device?.model || device?.friendlyName || '';

  async function toggle() {
    if (!config.showToggle || busy) return;
    if (!config.togglePayloadKey || !config.onPayload || !config.offPayload) return;
    const next = !isOn;
    setOptimistic(next);
    setBusy(true);
    try {
      await onCommand(
        { physicalDeviceId: config.physicalDeviceId, deviceIeeeAddr: config.ieeeAddr },
        next ? config.onPayload : config.offPayload,
      );
    } catch {
      setOptimistic(!next);
    } finally {
      setBusy(false);
      setTimeout(() => setOptimistic(null), 2000);
    }
  }

  return (
    <div
      className={`relative h-full w-full bg-gradient-to-br ${ACCENT_BG[config.accent]} flex flex-col`}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${ACCENT_ICON[config.accent]}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              className="w-6 h-6"
            >
              {HERO_ICON[config.icon]}
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{config.title}</p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {config.showToggle && (
          <button
            onClick={toggle}
            disabled={busy || !config.togglePayloadKey}
            aria-label={isOn ? 'Выключить' : 'Включить'}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              isOn ? 'bg-slate-900' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                isOn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        )}
      </div>

      {(config.chips?.length ?? 0) > 0 && (
        <div className="px-4 pt-2 flex flex-wrap gap-1.5">
          {config.chips!.slice(0, 3).map((chip) => (
            <span
              key={chip}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ACCENT_CHIP[config.accent]}`}
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1" />

      {(config.stats?.length ?? 0) > 0 && (
        <div className="px-3 pb-3 grid grid-flow-col auto-cols-fr gap-2">
          {config.stats!.slice(0, 3).map((stat) => {
            const num = readNumeric(state, stat.key);
            return (
              <div
                key={stat.key + stat.caption}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm"
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${ACCENT_ICON[config.accent]}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    className="w-3.5 h-3.5"
                  >
                    {STAT_ICON[stat.icon]}
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tabular-nums text-foreground truncate">
                    {num != null ? num : '—'}
                    {stat.unit ? ` ${stat.unit}` : ''}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">
                    {stat.caption}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
