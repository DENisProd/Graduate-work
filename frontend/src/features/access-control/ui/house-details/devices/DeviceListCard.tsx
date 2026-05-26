'use client';

import type { MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { zigbeeDevicesApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { ZigbeeDeviceListItem, ZigbeeStateWire } from '@/types/api';
import { useZigbeeCommand } from '@/features/access-control/hooks/useZigbeeCommand';
import {
  isZigbeeDevice,
  zigbeeDisplayName,
} from '@/features/access-control/lib/zigbee-device-utils';
import { connectivityFromLastOnline, connectivityLabel } from '@/lib/device-connectivity';
import { TelemetryFlashOverlay, useTelemetryPulseKey } from './TelemetryFlashOverlay';
import { DeviceTelemetryBlock } from './DeviceTelemetryBlock';

function zigbeeModel(device: ZigbeeDeviceListItem): string | null {
  return device.modelId ?? device.model ?? null;
}

function definitionStringField(
  definition: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  if (!definition || typeof definition !== 'object') return null;
  const v = definition[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export function DeviceListCard({
  device,
  houseId,
  live,
  isSocketConnected,
  onRemoved,
}: {
  device: ZigbeeDeviceListItem;
  houseId: string;
  live: ZigbeeStateWire | undefined;
  isSocketConnected: boolean;
  onRemoved: (id: string) => void;
}) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const model = zigbeeModel(device);
  const vendor =
    definitionStringField(device.definition, 'vendor') ?? device.manufacturerName ?? null;
  const defDescription = definitionStringField(device.definition, 'description');
  const showTelemetry = isZigbeeDevice(device) || Boolean(live);
  const lastOnline = live?.timestamp ?? (device as any)?.lastSeen ?? null;
  const connectivity = connectivityFromLastOnline(lastOnline);
  const isOffline = connectivity === 'OFFLINE';
  const telemetryPulseKey = useTelemetryPulseKey(connectivity === 'ONLINE' ? live : undefined);

  const caps = new Set((device.capabilities ?? []).map((c) => c.toLowerCase()));
  const hasToggle =
    caps.has('state') ||
    (typeof live?.metrics.state === 'string' && live.metrics.state.length > 0);

  const { sendCommand, state: cmdState } = useZigbeeCommand();
  const [optimisticOn, setOptimisticOn] = useState<boolean | null>(null);
  const prevStateIdRef = useRef<string | null>(null);
  useEffect(() => {
    const sid = live?.stateId ?? null;
    if (sid !== null && sid !== prevStateIdRef.current) {
      prevStateIdRef.current = sid;
      setOptimisticOn(null);
    }
  }, [live?.stateId]);

  const isPending = cmdState.status === 'pending';
  const displayIsOn = optimisticOn !== null ? optimisticOn : live?.metrics.state === 'ON';

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    if (isPending || !isSocketConnected || isOffline) return;
    const newOn = !displayIsOn;
    setOptimisticOn(newOn);
    void sendCommand({ physicalDeviceId: device.id }, { state: newOn ? 'ON' : 'OFF' }).then(
      (ack) => { if (!ack.ok) setOptimisticOn(null); }
    );
  };

  const ieeeAddr = device.ieeeAddr ?? device.protocolAddress ?? null;

  const handleRemoveClick = (e: MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmRemove = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!ieeeAddr) return;
    setRemoving(true);
    try {
      await zigbeeDevicesApi.remove(ieeeAddr, true);
      showToast(t('admin.accessControl.connectedDevices.removeDeviceSuccess'), 'success');
      onRemoved(device.id);
    } catch {
      showToast(t('admin.accessControl.connectedDevices.removeDeviceError'), 'error');
    } finally {
      setRemoving(false);
      setConfirmOpen(false);
    }
  };

  const handleCancelRemove = (e: MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(false);
  };

  return (
    <Card
      className={cn(
        'relative cursor-pointer border border-border bg-card shadow-sm transition hover:border-accent',
        isOffline && 'hover:border-border'
      )}
      onClick={() => router.push(`/admin/access-control/houses/${houseId}/devices/${device.id}`)}
    >
      <TelemetryFlashOverlay pulseKey={telemetryPulseKey} />
      {isOffline ? (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-xl">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/80 text-muted-foreground ring-1 ring-border backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h.01" />
                <path d="M8.5 16.429a5 5 0 0 1 7 0" />
                <path d="M5 12.859a10 10 0 0 1 5.17-2.69" />
                <path d="M19 12.859a10 10 0 0 0-2.007-1.523" />
                <path d="m2 2 20 20" />
              </svg>
            </div>
          </div>
          <div className="absolute inset-0 rounded-xl bg-background/10" />
        </div>
      ) : null}
      {confirmOpen ? (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/95 p-4 text-center backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-semibold text-foreground">
            {t('admin.accessControl.connectedDevices.removeDeviceConfirmTitle')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('admin.accessControl.connectedDevices.removeDeviceConfirmText')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={removing}
              onClick={handleConfirmRemove}
              className={cn(
                'rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground',
                'transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {removing ? '…' : t('admin.accessControl.connectedDevices.removeDevice')}
            </button>
            <button
              type="button"
              disabled={removing}
              onClick={handleCancelRemove}
              className={cn(
                'rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground',
                'transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : null}
      <CardHeader className="relative z-[1] flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">
            {device.name?.trim()
              ? device.name.trim()
              : ([vendor, model].filter(Boolean).join(' · ') || zigbeeDisplayName(device))}
          </CardTitle>
          {defDescription ? (
            <CardDescription className="line-clamp-2 text-xs">{defDescription}</CardDescription>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              connectivity === 'ONLINE'
                ? 'border-emerald-500/40 text-emerald-600'
                : connectivity === 'UNKNOWN'
                  ? 'border-yellow-500/40 text-yellow-600'
                  : 'border-border text-muted-foreground'
            )}
          >
            {connectivityLabel(connectivity, locale)}
          </Badge>
          {isZigbeeDevice(device) ? (
            <Badge variant="secondary" className="text-xs">
              {t('admin.accessControl.connectedDevices.protocolZigbee')}
            </Badge>
          ) : null}
          {ieeeAddr ? (
            <button
              type="button"
              title={t('admin.accessControl.connectedDevices.removeDevice')}
              onClick={handleRemoveClick}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-md border border-transparent',
                'text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive'
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          'relative z-[1] space-y-2 text-sm text-muted-foreground',
          isOffline && 'opacity-50'
        )}
      >
        {hasToggle ? (
          <div
            className="flex items-center gap-2.5"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="switch"
              aria-checked={displayIsOn}
              disabled={isPending || !isSocketConnected || isOffline}
              onClick={handleToggle}
              className={cn(
                'relative inline-flex h-[1.375rem] w-9 shrink-0 cursor-pointer items-center rounded-full',
                'border-2 border-transparent outline-none transition-colors duration-200',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'disabled:cursor-not-allowed disabled:opacity-40',
                displayIsOn ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-input',
                isPending && 'opacity-70'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none block h-[1.125rem] w-[1.125rem] rounded-full bg-primary-foreground shadow-sm transition-transform duration-200',
                  displayIsOn ? 'translate-x-[0.875rem]' : 'translate-x-0'
                )}
              />
            </button>
            <span className="select-none text-[11px] font-medium text-muted-foreground">
              {displayIsOn
                ? t('admin.accessControl.connectedDevices.controlOn')
                : t('admin.accessControl.connectedDevices.controlOff')}
            </span>
          </div>
        ) : null}
        {showTelemetry ? (
          <DeviceTelemetryBlock live={live} socketConnected={isSocketConnected} />
        ) : null}
      </CardContent>
    </Card>
  );
}
