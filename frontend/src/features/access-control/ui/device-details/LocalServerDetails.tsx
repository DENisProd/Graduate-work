'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
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
  if (status === 'authorized') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (status === 'pending') return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
  if (status === 'denied') return 'text-red-400 border-red-500/30 bg-red-500/10';
  return 'text-muted-foreground border-border bg-muted/30';
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => router.push(resolvedBackHref)}
          className="group flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-3.5 transition-transform group-hover:-translate-x-0.5">
            <path d="M9 2L4 7l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {resolvedBackLabel}
        </button>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-40"
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className={cn('size-3.5', loading && 'animate-spin')}
          >
            <path d="M12 7A5 5 0 112 7" strokeLinecap="round" />
            <path d="M12 3v4h-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('admin.retry')}
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(59,130,246,0.10) 0%, transparent 70%)',
          }}
        />
        <div className="relative flex flex-wrap items-center gap-5 px-6 py-5 sm:flex-nowrap">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/40">
            <svg viewBox="0 0 24 24" fill="none" className="size-8 text-foreground/80" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="5" width="18" height="12" rx="2" />
              <path d="M7 19h10M9 9h6M9 13h3" strokeLinecap="round" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
                {loading && !server ? (
                  <span className="inline-block h-6 w-48 animate-pulse rounded-lg bg-muted" />
                ) : (
                  title
                )}
              </h1>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] text-muted-foreground">{serverId}</span>
              <Badge variant="secondary" className="text-xs">
                {t('admin.accessControl.connectedDevices.localServer.deviceBadge')}
              </Badge>
            </div>
          </div>

          {server ? (
            <div className={cn('shrink-0 rounded-xl border px-3.5 py-2 text-center', statusClass(server.status))}>
              <div className="text-[10px] uppercase tracking-widest opacity-60">
                {t('admin.accessControl.connectedDevices.deviceDetails.statusLabel')}
              </div>
              <div className="mt-0.5 text-sm font-semibold">{server.status}</div>
            </div>
          ) : null}
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
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2.5 border-b border-border px-5 py-3">
              <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                {t('admin.accessControl.connectedDevices.localServer.detailsTitle')}
              </span>
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
