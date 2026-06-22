'use client';

import { useEffect, useRef, useState } from 'react';
import type { SliderControlConfig } from '../../types/widget.types';
import type { ZigbeeStateWire } from '@/types/api';
import type { ZigbeeCommandAck } from '@/features/access-control/lib/zigbee-telemetry-manager';
import { readPayloadValue } from '../../lib/useWidgetTelemetry';

interface Props {
  config: SliderControlConfig;
  state?: ZigbeeStateWire;
  readOnly?: boolean;
  onCommand: (
    device: { deviceIeeeAddr?: string; physicalDeviceId?: string },
    payload: Record<string, unknown>,
  ) => Promise<ZigbeeCommandAck>;
}

const ACCENT_BG: Record<SliderControlConfig['accent'], string> = {
  green: 'bg-emerald-500',
  blue: 'bg-sky-500',
  amber: 'bg-amber-400',
};

const ACCENT_TEXT: Record<SliderControlConfig['accent'], string> = {
  green: 'text-emerald-600',
  blue: 'text-sky-600',
  amber: 'text-amber-600',
};

const ACCENT_THUMB: Record<SliderControlConfig['accent'], string> = {
  green: '[--accent:#10b981]',
  blue: '[--accent:#0ea5e9]',
  amber: '[--accent:#f59e0b]',
};

export function SliderControlWidget({ config, state, readOnly = false, onCommand }: Props) {
  const liveRaw = state ? readPayloadValue(state, config.payloadKey) : null;
  const liveNum =
    typeof liveRaw === 'number'
      ? liveRaw
      : liveRaw == null
        ? null
        : Number(liveRaw);
  const live = liveNum != null && !Number.isNaN(liveNum) ? liveNum : null;

  const [pending, setPending] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const value = pending ?? live ?? config.min;
  const range = Math.max(0.0001, config.max - config.min);
  const pct = Math.max(0, Math.min(1, (value - config.min) / range));

  const displayUnit = config.unit ?? '';
  const percentage = Math.round(pct * 100);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setPending(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void send(v);
    }, 250);
  }

  async function send(v: number) {
    if (readOnly || (!config.physicalDeviceId && !config.ieeeAddr)) return;
    setBusy(true);
    try {
      const key = config.commandKey ?? config.payloadKey;
      await onCommand(
        { physicalDeviceId: config.physicalDeviceId, deviceIeeeAddr: config.ieeeAddr },
        { [key]: v },
      );
    } catch {
      setPending(null);
    } finally {
      setBusy(false);
      setTimeout(() => setPending(null), 1500);
    }
  }

  return (
    <div className="flex flex-col h-full px-4 py-3 gap-3 justify-center">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{config.label}</p>
          {config.subtitle && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {config.subtitle}
            </p>
          )}
        </div>
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <span className={`text-lg font-bold tabular-nums ${ACCENT_TEXT[config.accent]}`}>
            {percentage}
          </span>
          <span className="text-xs text-muted-foreground">
            {displayUnit || '%'} {busy ? '…' : ''}
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700/40 overflow-hidden">
          <div
            className={`h-full ${ACCENT_BG[config.accent]} transition-all`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step ?? 1}
          value={value}
          onChange={handleChange}
          disabled={readOnly || (!config.physicalDeviceId && !config.ieeeAddr)}
          aria-label={config.label}
          className={`absolute inset-0 w-full h-2 appearance-none bg-transparent cursor-pointer ${ACCENT_THUMB[config.accent]}
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab
            [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:border-0`}
        />
      </div>
      {!config.physicalDeviceId && (
        <p className="text-[10px] text-muted-foreground">Устройство не выбрано</p>
      )}
    </div>
  );
}
