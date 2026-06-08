'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks';
import type { HouseMqttConfigResponse } from '@/types/api';
import type { HouseMqttStatusState } from '@/features/access-control/hooks/useHouseMqttStatus';

interface HouseMqttBannerProps {
  houseId: string;
  state: HouseMqttStatusState;
  config: HouseMqttConfigResponse | null;
  isSocketConnected?: boolean;
  onReconnect?: () => void;
  reconnecting?: boolean;
  onRefresh?: () => void;
}

function formatTs(value: string | undefined, locale: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(locale);
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok
          ? 'inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500'
          : 'inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500'
      }
    />
  );
}

export function HouseMqttBanner({
  houseId,
  state,
  config,
  isSocketConnected,
  onReconnect,
  reconnecting = false,
  onRefresh,
}: HouseMqttBannerProps) {
  const { t, locale } = useTranslation();
  const settingsHref = `/dashboard/houses/${encodeURIComponent(houseId)}/settings`;

  if (state === 'loading') {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        {t('admin.accessControl.connectedDevices.mqttStatus.loading')}
      </div>
    );
  }

  if (state === 'not_configured') {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t('admin.accessControl.connectedDevices.mqttBanner.title')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('admin.accessControl.connectedDevices.mqttBanner.notConfigured')}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={settingsHref}>
            {t('admin.accessControl.connectedDevices.mqttBanner.openSettings')}
          </Link>
        </Button>
      </div>
    );
  }

  const status = config?.status;
  const cloudConnected = Boolean(status?.connected);
  const localConnected = Boolean(status?.localServer?.connected);
  const cloudHandshake = formatTs(status?.connectedAt, locale);
  const lastMessage = formatTs(status?.lastMessageAt, locale);
  const localHandshake = formatTs(status?.localServer?.connectedAt, locale);
  const showWarningBanner = !cloudConnected;

  return (
    <div className="space-y-3">
      {showWarningBanner ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t('admin.accessControl.connectedDevices.mqttBanner.title')}
              </p>
              <p className="text-xs text-muted-foreground">
                {status?.lastError
                  ? t('admin.accessControl.connectedDevices.mqttBanner.reconnectFailedDetail', {
                      detail: status.lastError,
                    })
                  : t('admin.accessControl.connectedDevices.mqttBanner.disconnected')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {onReconnect ? (
              <Button variant="secondary" size="sm" onClick={onReconnect} disabled={reconnecting}>
                {reconnecting
                  ? t('admin.accessControl.connectedDevices.mqttBanner.reconnecting')
                  : t('admin.accessControl.connectedDevices.mqttBanner.reconnect')}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href={settingsHref}>
                {t('admin.accessControl.connectedDevices.mqttBanner.openSettings')}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {t('admin.accessControl.connectedDevices.mqttStatus.title')}
          </p>
          {onRefresh ? (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs" onClick={onRefresh}>
              <RefreshCw className="h-3.5 w-3.5" />
              {t('admin.accessControl.connectedDevices.mqttStatus.refresh')}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1 rounded-lg border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <StatusDot ok={cloudConnected} />
              {t('admin.accessControl.connectedDevices.mqttStatus.cloudTitle')}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {cloudConnected
                ? t('admin.accessControl.connectedDevices.mqttStatus.connected')
                : t('admin.accessControl.connectedDevices.mqttStatus.disconnected')}
            </p>
            {cloudHandshake ? (
              <p className="text-[11px] text-muted-foreground">
                {t('admin.accessControl.connectedDevices.mqttStatus.lastHandshake', {
                  value: cloudHandshake,
                })}
              </p>
            ) : null}
            {lastMessage ? (
              <p className="text-[11px] text-muted-foreground">
                {t('admin.accessControl.connectedDevices.mqttStatus.lastMessage', {
                  value: lastMessage,
                })}
              </p>
            ) : null}
          </div>

          <div className="space-y-1 rounded-lg border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <StatusDot ok={localConnected} />
              {t('admin.accessControl.connectedDevices.mqttStatus.localTitle')}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {localConnected
                ? t('admin.accessControl.connectedDevices.mqttStatus.connected')
                : t('admin.accessControl.connectedDevices.mqttStatus.localDisconnected')}
            </p>
            {status?.localServer?.username ? (
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {status.localServer.username}
              </p>
            ) : null}
            {localHandshake ? (
              <p className="text-[11px] text-muted-foreground">
                {t('admin.accessControl.connectedDevices.mqttStatus.lastHandshake', {
                  value: localHandshake,
                })}
              </p>
            ) : null}
          </div>

          {typeof isSocketConnected === 'boolean' ? (
            <div className="space-y-1 rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                {isSocketConnected ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                )}
                {t('admin.accessControl.connectedDevices.mqttStatus.realtimeTitle')}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isSocketConnected
                  ? t('admin.accessControl.connectedDevices.mqttStatus.realtimeConnected')
                  : t('admin.accessControl.connectedDevices.mqttStatus.realtimeDisconnected')}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Poll MQTT status while the devices tab is open. */
export function useMqttStatusPolling(
  enabled: boolean,
  refetch: () => void | Promise<void>,
  intervalMs = 10_000,
) {
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      void refetch();
    }, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, refetch]);
}
