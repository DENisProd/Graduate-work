'use client';

import { useState } from 'react';
import type { ControlButtonConfig } from '../../types/widget.types';
import type { ZigbeeCommandAck } from '@/features/access-control/lib/zigbee-telemetry-manager';
import { coerceCommandValue } from '../../lib/command-value';
import { modbusApi } from '@/lib/api-client';

interface Props {
  config: ControlButtonConfig;
  readOnly?: boolean;
  onCommand: (
    device: { deviceIeeeAddr?: string; physicalDeviceId?: string },
    payload: Record<string, unknown>,
  ) => Promise<ZigbeeCommandAck>;
}

const STYLE_MAP = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent border border-border hover:bg-accent text-foreground',
};

export function ControlButtonWidget({ config, readOnly = false, onCommand }: Props) {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<'ok' | 'error' | null>(null);

  async function handleClick() {
    if (readOnly || loading) return;
    if (config.confirmRequired && !confirm(`Выполнить: ${config.label}?`)) return;
    setLoading(true);
    setLastResult(null);
    try {
      if (config.source === 'modbus') {
        if (!config.modbusDeviceId || !config.modbusRegisterId) throw new Error('Не выбран Modbus регистр');
        const body =
          config.modbusRegisterType === 'holding'
            ? { value: Number(config.commandValue) }
            : { coil: config.commandValue === 'true' };
        await modbusApi.writeRegister(config.modbusDeviceId, config.modbusRegisterId, body);
        setLastResult('ok');
      } else {
        const ack = await onCommand(
          { physicalDeviceId: config.physicalDeviceId, deviceIeeeAddr: config.ieeeAddr },
          { [config.commandKey]: coerceCommandValue(config.commandValue, config.commandValueType) },
        );
        setLastResult(ack.ok ? 'ok' : 'error');
      }
    } catch {
      setLastResult('error');
    } finally {
      setLoading(false);
      setTimeout(() => setLastResult(null), 3000);
    }
  }

  return (
    <div className="flex flex-col h-full items-center justify-center gap-2 px-2">
      <button
        onClick={handleClick}
        disabled={readOnly || loading}
        className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${STYLE_MAP[config.buttonStyle]}`}
      >
        {loading ? '...' : config.label}
      </button>
      {lastResult === 'ok' && <p className="text-xs text-green-600">Отправлено</p>}
      {lastResult === 'error' && <p className="text-xs text-red-500">Ошибка</p>}
    </div>
  );
}
