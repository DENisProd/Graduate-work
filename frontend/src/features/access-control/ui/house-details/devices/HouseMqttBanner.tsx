'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks';
import type { HouseMqttStatusState } from '@/features/access-control/hooks/useHouseMqttStatus';

interface HouseMqttBannerProps {
  houseId: string;
  state: HouseMqttStatusState;
  onReconnect?: () => void;
  reconnecting?: boolean;
}

export function HouseMqttBanner({
  houseId,
  state,
  onReconnect,
  reconnecting = false,
}: HouseMqttBannerProps) {
  const { t } = useTranslation();

  if (state === 'loading' || state === 'connected') return null;

  const settingsHref = `/dashboard/houses/${encodeURIComponent(houseId)}/settings`;
  const descriptionKey =
    state === 'not_configured'
      ? 'admin.accessControl.connectedDevices.mqttBanner.notConfigured'
      : 'admin.accessControl.connectedDevices.mqttBanner.disconnected';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {t('admin.accessControl.connectedDevices.mqttBanner.title')}
          </p>
          <p className="text-xs text-muted-foreground">{t(descriptionKey)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {state === 'disconnected' && onReconnect ? (
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
  );
}
