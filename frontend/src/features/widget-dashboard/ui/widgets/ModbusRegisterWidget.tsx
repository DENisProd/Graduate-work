'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { modbusApi } from '@/lib/api-client';
import type { ModbusRegisterValueConfig, ModbusRegisterControlConfig } from '../../types/widget.types';
import type { ModbusRegisterStateResponse } from '@/types/api';

// ─── Value Widget ──────────────────────────────────────────────────────────────

const ACCENT_VALUE: Record<ModbusRegisterValueConfig['accent'], string> = {
  green: 'text-emerald-600 dark:text-emerald-400',
  blue: 'text-blue-600 dark:text-blue-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
};

const ACCENT_BADGE: Record<ModbusRegisterValueConfig['accent'], string> = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function ModbusRegisterValueWidget({ config }: { config: ModbusRegisterValueConfig }) {
  const [state, setState] = useState<ModbusRegisterStateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetch = useCallback(async () => {
    if (!config.modbusDeviceId || !config.modbusRegisterId) return;
    setLoading(true);
    setError(false);
    try {
      const result = await modbusApi.readRegister(config.modbusDeviceId, config.modbusRegisterId);
      setState(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [config.modbusDeviceId, config.modbusRegisterId]);

  useEffect(() => {
    fetch();
    if (config.refreshInterval > 0) {
      const id = setInterval(fetch, config.refreshInterval * 1000);
      return () => clearInterval(id);
    }
  }, [fetch, config.refreshInterval]);

  const displayValue = state
    ? state.scaledValues.length === 1
      ? state.scaledValues[0].toFixed(2)
      : state.scaledValues.map((v) => v.toFixed(2)).join(', ')
    : '—';

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
      {config.label && (
        <p className="text-xs font-medium text-muted-foreground text-center">{config.label}</p>
      )}
      <div className={cn('text-3xl font-bold tabular-nums', ACCENT_VALUE[config.accent])}>
        {displayValue}
        {config.unit && state && (
          <span className="ml-1 text-lg font-normal text-muted-foreground">{config.unit}</span>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          Ошибка чтения
        </div>
      )}
      <div className="flex items-center gap-2">
        {state && (
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', ACCENT_BADGE[config.accent])}>
            Modbus
          </span>
        )}
        <button
          onClick={fetch}
          disabled={loading}
          className="rounded-full p-1 text-muted-foreground hover:bg-accent disabled:opacity-40"
          title="Обновить"
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
        </button>
      </div>
    </div>
  );
}

// ─── Control Widget ────────────────────────────────────────────────────────────

const ACCENT_CTRL: Record<ModbusRegisterControlConfig['accent'], { ring: string; on: string; off: string }> = {
  green: { ring: 'focus:ring-emerald-500', on: 'bg-emerald-600 hover:bg-emerald-700', off: 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700' },
  blue:  { ring: 'focus:ring-blue-500',   on: 'bg-blue-600 hover:bg-blue-700',   off: 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700' },
  amber: { ring: 'focus:ring-amber-500',  on: 'bg-amber-600 hover:bg-amber-700', off: 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700' },
};

export function ModbusRegisterControlWidget({ config }: { config: ModbusRegisterControlConfig }) {
  const [coilState, setCoilState] = useState<boolean | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ac = ACCENT_CTRL[config.accent];

  const handleCoilToggle = async () => {
    if (!config.modbusDeviceId || !config.modbusRegisterId) return;
    const next = !coilState;
    setLoading(true);
    setError(null);
    try {
      await modbusApi.writeRegister(config.modbusDeviceId, config.modbusRegisterId, { coil: next });
      setCoilState(next);
    } catch {
      setError('Ошибка записи');
    } finally {
      setLoading(false);
    }
  };

  const handleHoldingWrite = async () => {
    if (!config.modbusDeviceId || !config.modbusRegisterId || !inputVal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await modbusApi.writeRegister(config.modbusDeviceId, config.modbusRegisterId, { value: Number(inputVal.trim()) });
    } catch {
      setError('Ошибка записи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      {config.label && (
        <p className="text-xs font-medium text-muted-foreground text-center">{config.label}</p>
      )}

      {config.controlType === 'coil' ? (
        <button
          onClick={handleCoilToggle}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium disabled:opacity-60"
        >
          {coilState ? (
            <ToggleRight className={cn('h-8 w-8', loading ? 'text-muted-foreground' : 'text-emerald-500')} />
          ) : (
            <ToggleLeft className={cn('h-8 w-8', loading ? 'text-muted-foreground' : 'text-slate-400')} />
          )}
          {coilState == null ? '—' : coilState ? 'ON' : 'OFF'}
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Значение"
            className={cn(
              'w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2',
              ac.ring,
            )}
          />
          <button
            onClick={handleHoldingWrite}
            disabled={loading || !inputVal.trim()}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-60',
              ac.on,
            )}
          >
            {loading ? '…' : 'Записать'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Modbus</span>
    </div>
  );
}
