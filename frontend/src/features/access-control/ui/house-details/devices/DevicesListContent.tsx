'use client';

import { ServiceErrorCard } from '@/components/shared';
import { useTranslation } from '@/hooks';
import type { ZigbeeDeviceListItem, ZigbeeStateWire } from '@/types/api';
import type { DevicesLoadError } from '@/features/access-control/model/use-devices-tab';
import { DeviceListCard } from './DeviceListCard';

interface DevicesListContentProps {
  houseId: string | null;
  devices: ZigbeeDeviceListItem[];
  loading: boolean;
  error: DevicesLoadError;
  errorDetails: string[] | null;
  getLiveState: (device: ZigbeeDeviceListItem) => ZigbeeStateWire | undefined;
  isSocketConnected: boolean;
  onRetry: () => void;
  onDeviceRemoved: (id: string) => void;
}

export function DevicesListContent({
  houseId,
  devices,
  loading,
  error,
  errorDetails,
  getLiveState,
  isSocketConnected,
  onRetry,
  onDeviceRemoved,
}: DevicesListContentProps) {
  const { t } = useTranslation();

  if (!houseId) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('admin.noData')}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error === 'forbidden') {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('errors.unauthorized')}
      </div>
    );
  }

  if (error === 'error') {
    return (
      <ServiceErrorCard
        title={t('admin.accessControl.connectedDevices.serviceUnavailable.title')}
        description={t('admin.accessControl.connectedDevices.serviceUnavailable.description')}
        details={errorDetails ?? undefined}
        onRetry={onRetry}
      />
    );
  }

  if (devices.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('admin.noData')}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {devices.map((device) => (
        <DeviceListCard
          key={device.id}
          device={device}
          houseId={houseId}
          live={getLiveState(device)}
          isSocketConnected={isSocketConnected}
          onRemoved={onDeviceRemoved}
        />
      ))}
    </div>
  );
}
