'use client';

import { useState } from 'react';
import type { ControlButtonConfig } from '../../types/widget.types';
import type { ZigbeeCommandAck } from '@/features/access-control/lib/zigbee-telemetry-manager';

interface Props {
  config: ControlButtonConfig;
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

export function ControlButtonWidget({ config, onCommand }: Props) {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<'ok' | 'error' | null>(null);

  async function handleClick() {
    if (loading) return;
    if (config.confirmRequired && !confirm(`Выполнить: ${config.label}?`)) return;
    setLoading(true);
    setLastResult(null);
    try {
      const ack = await onCommand(
        { physicalDeviceId: config.physicalDeviceId, deviceIeeeAddr: config.ieeeAddr },
        config.commandPayload,
      );
      setLastResult(ack.ok ? 'ok' : 'error');
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
        disabled={loading}
        className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${STYLE_MAP[config.buttonStyle]}`}
      >
        {loading ? '...' : config.label}
      </button>
      {lastResult === 'ok' && <p className="text-xs text-green-600">Отправлено</p>}
      {lastResult === 'error' && <p className="text-xs text-red-500">Ошибка</p>}
    </div>
  );
}
