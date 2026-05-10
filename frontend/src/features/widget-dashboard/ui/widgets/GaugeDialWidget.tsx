'use client';

import { useMemo } from 'react';
import type { GaugeDialConfig } from '../../types/widget.types';
import type { ZigbeeStateWire } from '@/types/api';
import { readPayloadValue } from '../../lib/useWidgetTelemetry';

interface Props {
  config: GaugeDialConfig;
  state?: ZigbeeStateWire;
}

const ACCENT_STROKE: Record<GaugeDialConfig['accent'], string> = {
  green: 'stroke-emerald-500',
  blue: 'stroke-sky-500',
  amber: 'stroke-amber-500',
  red: 'stroke-rose-500',
};

const ACCENT_TEXT: Record<GaugeDialConfig['accent'], string> = {
  green: 'text-emerald-600',
  blue: 'text-sky-600',
  amber: 'text-amber-600',
  red: 'text-rose-600',
};

const ACCENT_CHIP: Record<GaugeDialConfig['accent'], string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  blue: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  red: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

export function GaugeDialWidget({ config, state }: Props) {
  const raw = state ? readPayloadValue(state, config.payloadKey) : null;
  const numeric = typeof raw === 'number' ? raw : raw == null ? null : Number(raw);
  const value = numeric != null && !Number.isNaN(numeric) ? numeric : null;

  const { progress, color } = useMemo(() => {
    if (value == null) return { progress: 0, color: ACCENT_STROKE[config.accent] };
    const clamped = Math.max(config.min, Math.min(config.max, value));
    const range = Math.max(0.0001, config.max - config.min);
    const pct = (clamped - config.min) / range;
    let c = ACCENT_STROKE[config.accent];
    if (config.criticalAt != null && value >= config.criticalAt) c = 'stroke-rose-500';
    else if (config.warnAt != null && value >= config.warnAt) c = 'stroke-amber-500';
    return { progress: pct, color: c };
  }, [value, config.min, config.max, config.accent, config.warnAt, config.criticalAt]);

  // Half-circle arc, 180°, radius 80, stroke 12
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col h-full px-3 py-2 gap-2">
      {(config.chips?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5">
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

      <div className="flex-1 flex items-center justify-center min-h-0 relative">
        <svg
          viewBox="0 0 200 110"
          className="w-full h-full max-h-[180px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            className="stroke-slate-200/80 dark:stroke-slate-700/40"
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            className={color}
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 400ms ease' }}
          />
          <text
            x="20"
            y="108"
            className="fill-muted-foreground text-[10px]"
            textAnchor="middle"
          >
            {config.min}
            {config.unit ?? ''}
          </text>
          <text
            x="180"
            y="108"
            className="fill-muted-foreground text-[10px]"
            textAnchor="middle"
          >
            {config.max}
            {config.unit ?? ''}
          </text>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 pointer-events-none">
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold tabular-nums ${ACCENT_TEXT[config.accent]}`}>
              {value == null ? '—' : value.toFixed(1)}
            </span>
            {config.unit && (
              <span className="text-sm text-muted-foreground">{config.unit}</span>
            )}
          </div>
          {config.label && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
              {config.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
