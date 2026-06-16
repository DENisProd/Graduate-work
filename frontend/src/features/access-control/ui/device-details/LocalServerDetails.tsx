'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks';
import type { ConnectedLocalServerItem } from '@/lib/api/access-service';
import { useConnectedLocalServers } from '@/features/access-control/model/use-connected-local-servers';
import { cn } from '@/lib/utils';

interface LocalServerDetailsProps {
  houseId: string;
  serverId: string;
  backHref?: string;
  backLabel?: string;
}

function statusClass(status: ConnectedLocalServerItem['status']): string {
  if (status === 'authorized') return 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400';
  if (status === 'pending') return 'border-yellow-500/40 text-yellow-600 dark:text-yellow-400';
  if (status === 'denied') return 'border-destructive/40 text-destructive';
  return 'border-border text-muted-foreground';
}

function formatValue(value: string | null | undefined): string {
  return value && value.length > 0 ? value : '-';
}

export function LocalServerDetails({
  houseId,
  serverId,
  backHref,
  backLabel,
}: LocalServerDetailsProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { servers, loading, load, logoutFrontend, logoutServer } = useConnectedLocalServers();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const server = useMemo(
    () => servers.find((item) => item.id === serverId) ?? null,
    [serverId, servers]
  );

  const resolvedBackHref = backHref ?? `/admin/access-control/houses/${houseId}`;
  const resolvedBackLabel = backLabel ?? t('admin.accessControl.connectedDevices.backToDevices');
  const title = t('admin.accessControl.connectedDevices.localServer.defaultDisplayName');

  const handleLogoutServer = async () => {
    setLoggingOut(true);
    const ok = await logoutServer(serverId);
    setLoggingOut(false);
    if (ok) router.push(resolvedBackHref);
  };

  const fields = server
    ? [
        {
          label: t('admin.accessControl.connectedDevices.localServer.fields.sessionId'),
          value: server.id,
        },
        {
          label: t('admin.accessControl.connectedDevices.localServer.fields.userCode'),
          value: server.userCode,
        },
        {
          label: t('admin.accessControl.connectedDevices.localServer.fields.externalUserId'),
          value: server.externalUserId,
        },
        {
          label: t('admin.accessControl.connectedDevices.localServer.fields.authorizedAt'),
          value: server.authorizedAt ? new Date(server.authorizedAt).toLocaleString() : null,
        },
        {
          label: t('admin.accessControl.connectedDevices.localServer.fields.lastSeenAt'),
          value: server.lastSeenAt ? new Date(server.lastSeenAt).toLocaleString() : null,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push(resolvedBackHref)}
          className="text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {resolvedBackLabel}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
          className="text-muted-foreground"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          {t('admin.retry')}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-start gap-4 px-6 py-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30">
            <svg viewBox="0 0 24 24" fill="none" className="size-6 text-muted-foreground" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="5" width="18" height="12" rx="2" />
              <path d="M7 19h10M9 9h6M9 13h3" strokeLinecap="round" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-foreground">
              {loading && !server ? (
                <span className="inline-block h-6 w-48 animate-pulse rounded-md bg-muted" />
              ) : (
                title
              )}
            </h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{serverId}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {t('admin.accessControl.connectedDevices.localServer.deviceBadge')}
              </Badge>
              {server ? (
                <Badge variant="outline" className={cn('text-[10px]', statusClass(server.status))}>
                  {server.status}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {loading && !server ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
            <span className="text-xs text-muted-foreground">{t('common.loading')}</span>
          </div>
        </div>
      ) : null}

      {!loading && !server ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('admin.accessControl.connectedDevices.localServer.notFound')}
        </div>
      ) : null}

      {server ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('admin.accessControl.connectedDevices.localServer.detailsTitle')}
              </h2>
            </div>
            <div className="divide-y divide-border">
              {fields.map((field) => (
                <div
                  key={field.label}
                  className="grid grid-cols-1 items-baseline gap-1 px-5 py-2.5 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(9rem,13rem)_1fr]"
                >
                  <dt className="text-xs text-muted-foreground">{field.label}</dt>
                  <dd className="break-all font-mono text-xs text-foreground/80">
                    {formatValue(field.value)}
                  </dd>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t('admin.accessControl.connectedDevices.localServer.actionsTitle')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('admin.accessControl.connectedDevices.localServer.actionsDescription')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AppButton
                  size="sm"
                  variant="secondary"
                  disabled={loggingOut}
                  onClick={() => void logoutFrontend()}
                >
                  {t('admin.accessControl.connectedDevices.localServer.logoutFrontend')}
                </AppButton>
                <AppButton
                  size="sm"
                  variant="destructive"
                  disabled={loggingOut}
                  onClick={() => void handleLogoutServer()}
                >
                  {loggingOut
                    ? t('common.loading')
                    : t('admin.accessControl.connectedDevices.localServer.logout')}
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
