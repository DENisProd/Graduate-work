'use client';

import { useState } from 'react';
import type { ControlToggleConfig } from '../../types/widget.types';
import type { ZigbeeStateWire } from '@/types/api';
import type { ZigbeeCommandAck } from '@/features/access-control/lib/zigbee-telemetry-manager';
import { readPayloadValue } from '../../lib/useWidgetTelemetry';
import { modbusApi } from '@/lib/api-client';

interface Props {
  config: ControlToggleConfig;
  state?: ZigbeeStateWire;
  onCommand: (
    device: { deviceIeeeAddr?: string; physicalDeviceId?: string },
    payload: Record<string, unknown>,
  ) => Promise<ZigbeeCommandAck>;
}

export function ControlToggleWidget({ config, state, onCommand }: Props) {
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const rawValue =
    config.source !== 'modbus' && state ? readPayloadValue(state, config.statePayloadKey) : null;
  const actualIsOn =
    rawValue === true ||
    (typeof rawValue === 'string' && rawValue.toUpperCase() === config.onValue?.toUpperCase());

  const isOn = optimistic !== null ? optimistic : actualIsOn;

  async function handleToggle() {
    if (loading) return;
    const next = !isOn;
    setOptimistic(next);
    setLoading(true);
    try {
      if (config.source === 'modbus') {
        if (!config.modbusDeviceId || !config.modbusRegisterId) throw new Error('Не выбран Modbus регистр');
        await modbusApi.writeRegister(config.modbusDeviceId, config.modbusRegisterId, { coil: next });
      } else {
        await onCommand(
          { physicalDeviceId: config.physicalDeviceId, deviceIeeeAddr: config.ieeeAddr },
          { [config.statePayloadKey]: next ? config.onValue : config.offValue },
        );
      }
    } catch {
      setOptimistic(!next);
    } finally {
      setLoading(false);
      setTimeout(() => setOptimistic(null), 2000);
    }
  }

  return (
    <div className="flex flex-col h-full items-center justify-center gap-3 px-3">
      {config.label && (
        <p className="text-sm font-medium text-foreground text-center truncate w-full">
          {config.label}
        </p>
      )}
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-label={isOn ? 'Выключить' : 'Включить'}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          isOn ? 'bg-blue-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
            isOn ? 'translate-x-8' : 'translate-x-1'
          }`}
        />
      </button>
      <p className={`text-xs font-medium ${isOn ? 'text-green-600' : 'text-muted-foreground'}`}>
        {isOn ? 'Включено' : 'Выключено'}
      </p>
    </div>
  );
}
