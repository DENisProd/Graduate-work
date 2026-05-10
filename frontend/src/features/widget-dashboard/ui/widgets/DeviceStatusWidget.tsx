'use client';

import type { DeviceStatusConfig } from '../../types/widget.types';
import type { PhysicalDeviceResponse, ZigbeeStateWire } from '@/types/api';
import { connectivityFromLastOnline, connectivityLabel } from '@/lib/device-connectivity';

interface Props {
  config: DeviceStatusConfig;
  device?: PhysicalDeviceResponse;
  state?: ZigbeeStateWire;
}

export function DeviceStatusWidget({ config, device, state }: Props) {
  const name = config.label || device?.friendlyName || device?.name || 'Устройство';
  const lastSeen = state?.timestamp ?? device?.lastSeen;
  const locale =
    typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'ru';
  const status =
    device?.status === 'ERROR' ? 'OFFLINE' : connectivityFromLastOnline(lastSeen);

  return (
    <div className="flex flex-col h-full gap-3 justify-center px-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 ${
            status === 'ONLINE'
              ? 'bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.4)]'
              : status === 'UNKNOWN'
                ? 'bg-yellow-400 shadow-[0_0_6px_2px_rgba(250,204,21,0.35)]'
                : 'bg-slate-300'
          }`}
        />
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground">
            {connectivityLabel(status, locale)}
          </p>
        </div>
      </div>
      {config.showLastSeen && lastSeen && (
        <p className="text-xs text-muted-foreground">
          Последний раз:{' '}
          {new Date(lastSeen).toLocaleString('ru', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      )}
      {device?.model && (
        <p className="text-xs text-muted-foreground truncate">Модель: {device.model}</p>
      )}
    </div>
  );
}
