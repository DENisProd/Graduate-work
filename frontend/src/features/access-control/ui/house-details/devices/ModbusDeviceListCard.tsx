'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ModbusDeviceResponse } from '@/types/api';

export function ModbusDeviceListCard({ device }: { device: ModbusDeviceResponse }) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        'relative border border-border bg-card shadow-sm',
        !device.enabled && 'opacity-70',
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{device.name}</CardTitle>
          {device.description ? (
            <CardDescription className="line-clamp-2 text-xs">{device.description}</CardDescription>
          ) : (
            <CardDescription className="text-xs">
              {t('admin.accessControl.connectedDevices.modbusSlaveId', { slaveId: device.slaveId })}
            </CardDescription>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              device.enabled
                ? 'border-emerald-500/40 text-emerald-600'
                : 'border-border text-muted-foreground',
            )}
          >
            {device.enabled
              ? t('admin.accessControl.connectedDevices.modbusEnabled')
              : t('admin.accessControl.connectedDevices.modbusDisabled')}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {t('admin.accessControl.connectedDevices.protocolModbus')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p className="font-mono text-xs">
          {t('admin.accessControl.connectedDevices.modbusSlaveId', { slaveId: device.slaveId })}
        </p>
        <p className="text-xs">{t('admin.accessControl.connectedDevices.modbusManagedLocally')}</p>
      </CardContent>
    </Card>
  );
}
