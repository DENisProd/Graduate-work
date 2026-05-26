'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks';
import type { ConnectedLocalServerItem } from '@/lib/api/access-service';
import { cn } from '@/lib/utils';
import { toLocalServerDeviceId } from '@/features/access-control/lib/local-server-device';

interface LocalServerDeviceCardProps {
  server: ConnectedLocalServerItem;
  detailsPathPrefix: string;
}

function statusClass(status: ConnectedLocalServerItem['status']): string {
  if (status === 'authorized') return 'border-emerald-500/40 text-emerald-600';
  if (status === 'pending') return 'border-yellow-500/40 text-yellow-600';
  if (status === 'denied') return 'border-red-500/40 text-red-600';
  return 'border-border text-muted-foreground';
}

export function LocalServerDeviceCard({ server, detailsPathPrefix }: LocalServerDeviceCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const title = t('admin.accessControl.connectedDevices.localServer.defaultDisplayName');
  const deviceId = toLocalServerDeviceId(server.id);

  return (
    <Card
      className="cursor-pointer border border-border bg-card shadow-sm transition hover:border-accent"
      onClick={() => router.push(`${detailsPathPrefix}/${encodeURIComponent(deviceId)}`)}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{title}</CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {t('admin.accessControl.connectedDevices.localServer.cardDescription')}
          </CardDescription>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <Badge variant="outline" className={cn('text-[10px]', statusClass(server.status))}>
            {server.status}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {t('admin.accessControl.connectedDevices.localServer.deviceBadge')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p className="truncate text-xs">
          {t('admin.accessControl.connectedDevices.localServer.sessionMeta', {
            sessionId: server.id.slice(0, 8),
            userCode: server.userCode,
          })}
        </p>
        {server.lastSeenAt ? (
          <p className="truncate text-xs">
            {t('admin.accessControl.connectedDevices.localServer.lastSeenAt', {
              value: new Date(server.lastSeenAt).toLocaleString(),
            })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
