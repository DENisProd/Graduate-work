'use client';

import type { CircularProgressConfig } from '../../types/widget.types';
import type { ZigbeeStateWire } from '@/types/api';
import { readPayloadValue } from '../../lib/useWidgetTelemetry';

interface Props {
  config: CircularProgressConfig;
  state?: ZigbeeStateWire;
}

const ACCENT_RING: Record<CircularProgressConfig['accent'], string> = {
  green: 'stroke-emerald-500',
  blue: 'stroke-sky-500',
  amber: 'stroke-amber-500',
  red: 'stroke-rose-500',
};

const ACCENT_BG: Record<CircularProgressConfig['accent'], string> = {
  green: 'bg-emerald-300/30',
  blue: 'bg-sky-300/30',
  amber: 'bg-amber-300/30',
  red: 'bg-rose-300/30',
};

const ACCENT_BADGE: Record<CircularProgressConfig['accent'], string> = {
  green: 'bg-white/90 text-emerald-700',
  blue: 'bg-white/90 text-sky-700',
  amber: 'bg-white/90 text-amber-700',
  red: 'bg-white/90 text-rose-700',
};

export function CircularProgressWidget({ config, state }: Props) {
  const liveValue =
    config.physicalDeviceId && config.payloadKey && state
      ? readPayloadValue(state, config.payloadKey)
      : null;
  const numericLive =
    typeof liveValue === 'number'
      ? liveValue
      : liveValue == null
        ? null
        : Number(liveValue);
  const valueRaw = numericLive != null && !Number.isNaN(numericLive)
    ? numericLive
    : config.staticValue ?? 0;
  const value = Math.max(0, Math.min(config.max, valueRaw));

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = config.max > 0 ? value / config.max : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className={`relative h-full w-full overflow-hidden ${ACCENT_BG[config.accent]}`}>
      <div className="relative h-full grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xl font-semibold leading-tight text-foreground truncate">
            {config.title}
          </p>
          {config.subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {config.subtitle}
            </p>
          )}
        </div>

        <div className="relative flex items-center justify-center w-32 h-32 flex-shrink-0">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              className="stroke-white/60"
              strokeWidth={10}
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              className={ACCENT_RING[config.accent]}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 400ms ease' }}
            />
          </svg>
          <div className="relative text-center">
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-3xl font-bold tabular-nums text-foreground">
                {Math.round((progress) * 100)}
              </span>
              <span className="text-sm text-muted-foreground">{config.unit ?? '%'}</span>
            </div>
            {config.badge && (
              <span
                className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${ACCENT_BADGE[config.accent]} shadow-sm`}
              >
                {config.badge}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
