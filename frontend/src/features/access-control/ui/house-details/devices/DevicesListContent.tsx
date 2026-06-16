'use client';

import { ServiceErrorCard } from '@/components/shared';
import { useTranslation } from '@/hooks';
import type { ZigbeeDeviceListItem, ZigbeeStateWire, ModbusDeviceResponse } from '@/types/api';
import type { DevicesLoadError } from '@/features/access-control/model/use-devices-tab';
import type { ConnectedLocalServerItem } from '@/lib/api/access-service';
import { DeviceListCard } from './DeviceListCard';
import { ModbusDeviceListCard } from './ModbusDeviceListCard';
import { LocalServerDeviceCard } from './LocalServerDeviceCard';

interface DevicesListContentProps {
  houseId: string | null;
  devices: ZigbeeDeviceListItem[];
  modbusDevices: ModbusDeviceResponse[];
  servers: ConnectedLocalServerItem[];
  loading: boolean;
  error: DevicesLoadError;
  errorDetails: string[] | null;
  getLiveState: (device: ZigbeeDeviceListItem) => ZigbeeStateWire | undefined;
  isSocketConnected: boolean;
  detailsPathPrefix: string | null;
  onRetry: () => void;
  onDeviceRemoved?: (id: string) => void;
}

export function DevicesListContent({
  houseId,
  devices,
  modbusDevices,
  servers,
  loading,
  error,
  errorDetails,
  getLiveState,
  isSocketConnected,
  detailsPathPrefix,
  onRetry,
  onDeviceRemoved,
}: DevicesListContentProps) {
  const { t } = useTranslation();
  const hasDevices = devices.length > 0;
  const hasModbus = modbusDevices.length > 0;
  const hasServers = servers.length > 0;

  if (!houseId || !detailsPathPrefix) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('admin.noData')}
      </div>
    );
  }

  if (loading && !hasServers) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error === 'forbidden' && !hasServers) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('errors.unauthorized')}
      </div>
    );
  }

  if (error === 'error' && !hasServers) {
    return (
      <ServiceErrorCard
        title={t('admin.accessControl.connectedDevices.serviceUnavailable.title')}
        description={t('admin.accessControl.connectedDevices.serviceUnavailable.description')}
        details={errorDetails ?? undefined}
        onRetry={onRetry}
      />
    );
  }

  if (!hasDevices && !hasModbus && !hasServers) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('admin.noData')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error === 'error' ? (
        <ServiceErrorCard
          title={t('admin.accessControl.connectedDevices.serviceUnavailable.title')}
          description={t('admin.accessControl.connectedDevices.serviceUnavailable.description')}
          details={errorDetails ?? undefined}
          onRetry={onRetry}
        />
      ) : null}

      {error === 'forbidden' ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('errors.unauthorized')}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {servers.map((server) => (
          <LocalServerDeviceCard
            key={`local-server-${server.id}`}
            server={server}
            detailsPathPrefix={detailsPathPrefix}
          />
        ))}
        {modbusDevices.map((device) => (
          <ModbusDeviceListCard key={`modbus-${device.id}`} device={device} />
        ))}
        {devices.map((device) => (
          <DeviceListCard
            key={device.id}
            device={device}
            detailsPathPrefix={detailsPathPrefix}
            live={getLiveState(device)}
            isSocketConnected={isSocketConnected}
            onRemoved={onDeviceRemoved}
          />
        ))}
      </div>
    </div>
  );
}
