'use client';

import type { TelemetryValueConfig } from '../../types/widget.types';
import type { ZigbeeStateWire } from '@/types/api';
import { readPayloadValue } from '../../lib/useWidgetTelemetry';

interface Props {
  config: TelemetryValueConfig;
  state?: ZigbeeStateWire;
}

function NumericDisplay({ value, unit }: { value: unknown; unit?: string }) {
  const num = typeof value === 'number' ? value.toFixed(1) : String(value ?? '—');
  return (
    <div className="flex items-end gap-1 justify-center">
      <span className="text-4xl font-bold tabular-nums text-foreground">{num}</span>
      {unit && <span className="text-lg text-muted-foreground mb-1">{unit}</span>}
    </div>
  );
}

function BadgeDisplay({ value }: { value: unknown }) {
  const str = String(value ?? '—').toUpperCase();
  const isOn = str === 'ON' || str === 'TRUE' || str === 'OPEN' || str === 'ACTIVE';
  return (
    <div className="flex items-center justify-center">
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${
          isOn ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {str}
      </span>
    </div>
  );
}

function BooleanDisplay({ value }: { value: unknown }) {
  const isTrue =
    value === true ||
    (typeof value === 'string' && ['on', 'true', 'open', 'active'].includes(value.toLowerCase()));
  return (
    <div className="flex items-center justify-center">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
          isTrue ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
        }`}
      >
        {isTrue ? '●' : '○'}
      </div>
    </div>
  );
}

export function TelemetryValueWidget({ config, state }: Props) {
  const value = state ? readPayloadValue(state, config.payloadKey) : null;

  return (
    <div className="flex flex-col h-full gap-2 justify-center px-2">
      {config.label && (
        <p className="text-xs text-muted-foreground text-center truncate">{config.label}</p>
      )}
      {value === null ? (
        <p className="text-center text-muted-foreground text-sm">—</p>
      ) : config.displayVariant === 'badge' ? (
        <BadgeDisplay value={value} />
      ) : config.displayVariant === 'boolean' ? (
        <BooleanDisplay value={value} />
      ) : (
        <NumericDisplay value={value} unit={config.unit} />
      )}
    </div>
  );
}
