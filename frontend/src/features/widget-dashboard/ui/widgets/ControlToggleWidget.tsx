'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ControlToggleConfig } from '../../types/widget.types';
import type { ZigbeeStateWire } from '@/types/api';
import type { ZigbeeCommandAck } from '@/features/access-control/lib/zigbee-telemetry-manager';
import { readPayloadValue } from '../../lib/useWidgetTelemetry';
import { modbusApi } from '@/lib/api-client';

interface Props {
  config: ControlToggleConfig;
  state?: ZigbeeStateWire;
  readOnly?: boolean;
  onCommand: (
    device: { deviceIeeeAddr?: string; physicalDeviceId?: string },
    payload: Record<string, unknown>,
  ) => Promise<ZigbeeCommandAck>;
}

export function ControlToggleWidget({ config, state, readOnly = false, onCommand }: Props) {
  const isModbus = config.source === 'modbus';
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [modbusOn, setModbusOn] = useState<boolean | null>(null);

  const refetchModbus = useCallback(async () => {
    if (!isModbus || !config.modbusDeviceId || !config.modbusRegisterId) return;
    try {
      const result = await modbusApi.readRegister(config.modbusDeviceId, config.modbusRegisterId);
      setModbusOn((result.rawValues?.[0] ?? 0) !== 0);
    } catch {
      // keep last known value on read failure
    }
  }, [isModbus, config.modbusDeviceId, config.modbusRegisterId]);

  useEffect(() => {
    refetchModbus();
  }, [refetchModbus]);

  const rawValue =
    !isModbus && state ? readPayloadValue(state, config.statePayloadKey) : null;
  const actualIsOn = isModbus
    ? modbusOn === true
    : rawValue === true ||
      (typeof rawValue === 'string' && rawValue.toUpperCase() === config.onValue?.toUpperCase());

  const isOn = optimistic !== null ? optimistic : actualIsOn;

  async function handleToggle() {
    if (readOnly || loading) return;
    const next = !isOn;
    setOptimistic(next);
    setLoading(true);
    try {
      if (isModbus) {
        if (!config.modbusDeviceId || !config.modbusRegisterId) throw new Error('Не выбран Modbus регистр');
        await modbusApi.writeRegister(config.modbusDeviceId, config.modbusRegisterId, { coil: next });
        await refetchModbus();
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
      if (isModbus) {
        setOptimistic(null);
      } else {
        setTimeout(() => setOptimistic(null), 2000);
      }
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
        disabled={readOnly || loading}
        aria-label={isOn ? 'Выключить' : 'Включить'}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          readOnly ? 'cursor-default' : ''
        } ${isOn ? 'bg-blue-600' : 'bg-slate-200'}`}
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
