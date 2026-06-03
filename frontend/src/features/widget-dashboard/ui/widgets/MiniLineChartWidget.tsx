'use client';

import { useState, useMemo } from 'react';
import type { MiniLineChartConfig } from '../../types/widget.types';
import type { ZigbeeStateWire } from '@/types/api';
import { readPayloadValue } from '../../lib/useWidgetTelemetry';

interface Props {
  config: MiniLineChartConfig;
  state?: ZigbeeStateWire;
}

const ACCENT_STROKE: Record<MiniLineChartConfig['accent'], string> = {
  green: 'stroke-emerald-500',
  blue: 'stroke-sky-500',
  amber: 'stroke-amber-500',
  red: 'stroke-rose-500',
};

const ACCENT_FILL: Record<MiniLineChartConfig['accent'], string> = {
  green: 'fill-emerald-500/20',
  blue: 'fill-sky-500/20',
  amber: 'fill-amber-500/20',
  red: 'fill-rose-500/20',
};

const ACCENT_BG: Record<MiniLineChartConfig['accent'], string> = {
  green: 'bg-emerald-50/60 dark:bg-emerald-900/15',
  blue: 'bg-sky-50/60 dark:bg-sky-900/15',
  amber: 'bg-amber-50/60 dark:bg-amber-900/15',
  red: 'bg-rose-50/60 dark:bg-rose-900/15',
};

const ACCENT_TEXT: Record<MiniLineChartConfig['accent'], string> = {
  green: 'text-emerald-700',
  blue: 'text-sky-700',
  amber: 'text-amber-700',
  red: 'text-rose-700',
};

interface Sample {
  ts: number;
  value: number;
}

export function MiniLineChartWidget({ config, state }: Props) {
  const buffer = config.bufferSize ?? 60;
  const [samples, setSamples] = useState<Sample[]>([]);
  const [lastTs, setLastTs] = useState<number | null>(null);
  const [trackedKey, setTrackedKey] = useState<string>(
    `${config.physicalDeviceId}:${config.payloadKey}`,
  );

  const currentKey = `${config.physicalDeviceId}:${config.payloadKey}`;
  if (trackedKey !== currentKey) {
    setTrackedKey(currentKey);
    setSamples([]);
    setLastTs(null);
  }

  if (state) {
    const v = readPayloadValue(state, config.payloadKey);
    const num = typeof v === 'number' ? v : v == null ? null : Number(v);
    const ts = state.timestamp ? Date.parse(state.timestamp) : null;
    if (
      ts != null &&
      ts !== lastTs &&
      num != null &&
      !Number.isNaN(num)
    ) {
      setLastTs(ts);
      setSamples((prev) => {
        const next = [...prev, { ts, value: num }];
        if (next.length > buffer) next.shift();
        return next;
      });
    }
  }

  const last = samples[samples.length - 1];

  const { path, area, min, max } = useMemo(() => {
    if (samples.length < 2) return { path: '', area: '', min: 0, max: 0 };
    const values = samples.map((s) => s.value);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const range = Math.max(0.0001, hi - lo);
    const w = 300;
    const h = 100;
    const stepX = w / Math.max(1, samples.length - 1);
    const points = samples.map((s, i) => {
      const x = i * stepX;
      const norm = (s.value - lo) / range;
      const y = h - norm * (h - 12) - 6;
      return [x, y] as const;
    });
    const p = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const a = `${p} L ${w.toFixed(1)} ${h} L 0 ${h} Z`;
    return { path: p, area: a, min: lo, max: hi };
  }, [samples]);

  return (
    <div className={`flex flex-col h-full w-full px-4 py-3 ${ACCENT_BG[config.accent]} relative`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{config.title}</p>
          {samples.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {samples.length} {samples.length === 1 ? 'значение' : 'значений'}
            </p>
          )}
        </div>
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <span className={`text-2xl font-bold tabular-nums ${ACCENT_TEXT[config.accent]}`}>
            {last ? last.value.toFixed(1) : '—'}
          </span>
          {config.unit && (
            <span className="text-xs text-muted-foreground">{config.unit}</span>
          )}
        </div>
      </div>

      <div className="flex-1 relative min-h-0 mt-2">
        {samples.length < 2 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
            Ожидание данных от устройства…
          </div>
        ) : (
          <svg
            viewBox="0 0 300 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <path d={area} className={ACCENT_FILL[config.accent]} stroke="none" />
            <path
              d={path}
              className={ACCENT_STROKE[config.accent]}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {samples.length >= 2 && (
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>min {min.toFixed(1)}{config.unit ?? ''}</span>
          <span>max {max.toFixed(1)}{config.unit ?? ''}</span>
        </div>
      )}
    </div>
  );
}
