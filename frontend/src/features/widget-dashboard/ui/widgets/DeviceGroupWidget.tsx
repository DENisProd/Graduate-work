'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DeviceGroupConfig, DeviceGroupItem } from '../../types/widget.types';
import type { ZigbeeStateWire } from '@/types/api';
import type { ZigbeeCommandAck } from '@/features/access-control/lib/zigbee-telemetry-manager';
import { readPayloadValue } from '../../lib/useWidgetTelemetry';
import { modbusApi } from '@/lib/api-client';
import { HERO_ICON } from './DeviceHeroWidget';

interface Props {
  config: DeviceGroupConfig;
  states: Map<string, ZigbeeStateWire>;
  onCommand: (
    device: { deviceIeeeAddr?: string; physicalDeviceId?: string },
    payload: Record<string, unknown>,
  ) => Promise<ZigbeeCommandAck>;
}

const ACCENT_ICON_BG: Record<DeviceGroupConfig['accent'], string> = {
  green: 'bg-emerald-500/15 text-emerald-700',
  blue: 'bg-sky-500/15 text-sky-700',
  amber: 'bg-amber-500/20 text-amber-700',
  slate: 'bg-slate-500/15 text-slate-700',
};

function isZigbeeOn(state: ZigbeeStateWire | undefined, item: DeviceGroupItem): boolean {
  if (!state) return false;
  const key = item.statePayloadKey || 'state';
  const v = readPayloadValue(state, key);
  if (v === true) return true;
  if (typeof v === 'string') return v.toUpperCase() === (item.onValue || 'ON').toUpperCase();
  return false;
}

function isItemReady(item: DeviceGroupItem): boolean {
  return item.source === 'modbus'
    ? !!(item.modbusDeviceId && item.modbusRegisterId)
    : !!(item.physicalDeviceId || item.ieeeAddr);
}

export function DeviceGroupWidget({ config, states, onCommand }: Props) {
  const items = config.items ?? [];
  const modbusItems = items.filter((i) => i.source === 'modbus' && i.modbusDeviceId && i.modbusRegisterId);
  const modbusKey = modbusItems.map((i) => `${i.id}:${i.modbusDeviceId}:${i.modbusRegisterId}`).join('|');

  const [modbusStates, setModbusStates] = useState<Record<string, boolean | null>>({});
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [groupBusy, setGroupBusy] = useState(false);

  const refreshModbus = useCallback(async () => {
    const results = await Promise.all(
      modbusItems.map(async (item) => {
        try {
          const result = await modbusApi.readRegister(item.modbusDeviceId!, item.modbusRegisterId!);
          return [item.id, (result.rawValues?.[0] ?? 0) !== 0] as const;
        } catch {
          return [item.id, null] as const;
        }
      }),
    );
    setModbusStates((prev) => {
      const next = { ...prev };
      for (const [id, val] of results) if (val !== null) next[id] = val;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modbusKey]);

  useEffect(() => {
    refreshModbus();
    const id = setInterval(refreshModbus, 15_000);
    return () => clearInterval(id);
  }, [refreshModbus]);

  function isOn(item: DeviceGroupItem): boolean {
    if (item.source === 'modbus') return modbusStates[item.id] === true;
    return isZigbeeOn(states.get(item.physicalDeviceId ?? ''), item);
  }

  async function setItem(item: DeviceGroupItem, next: boolean) {
    if (!isItemReady(item)) return;
    setBusyIds((b) => ({ ...b, [item.id]: true }));
    if (item.source === 'modbus') setModbusStates((s) => ({ ...s, [item.id]: next }));
    try {
      if (item.source === 'modbus') {
        await modbusApi.writeRegister(item.modbusDeviceId!, item.modbusRegisterId!, { coil: next });
      } else {
        await onCommand(
          { physicalDeviceId: item.physicalDeviceId, deviceIeeeAddr: item.ieeeAddr },
          { [item.statePayloadKey || 'state']: next ? (item.onValue || 'ON') : (item.offValue || 'OFF') },
        );
      }
    } catch {
      if (item.source === 'modbus') setModbusStates((s) => ({ ...s, [item.id]: !next }));
    } finally {
      setBusyIds((b) => ({ ...b, [item.id]: false }));
    }
  }

  async function setAll(next: boolean) {
    setGroupBusy(true);
    await Promise.all(items.filter(isItemReady).map((item) => setItem(item, next)));
    setGroupBusy(false);
  }

  const readyItems = items.filter(isItemReady);
  const allOn = readyItems.length > 0 && readyItems.every((i) => isOn(i));

  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ACCENT_ICON_BG[config.accent]}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
              {HERO_ICON[config.icon]}
            </svg>
          </div>
          <p className="truncate text-sm font-semibold text-foreground">{config.title}</p>
        </div>
        {config.showGroupToggle && items.length > 0 && (
          <button
            onClick={() => setAll(!allOn)}
            disabled={groupBusy}
            title="Переключить все"
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              allOn ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${allOn ? 'left-6' : 'left-1'}`}
            />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col divide-y divide-border overflow-y-auto">
        {items.length === 0 && (
          <p className="py-2 text-xs text-muted-foreground">Добавьте устройства в настройках виджета</p>
        )}
        {items.map((item) => {
          const on = isOn(item);
          const ready = isItemReady(item);
          return (
            <div key={item.id} className="flex items-center justify-between gap-2 py-1.5">
              <span className="truncate text-sm text-foreground">{item.label || '—'}</span>
              <button
                onClick={() => setItem(item, !on)}
                disabled={!!busyIds[item.id] || !ready}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                  on ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
