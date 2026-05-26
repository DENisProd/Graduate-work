'use client';

import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks';
import type { ConnectedLocalServerItem } from '@/lib/api/access-service';

interface ConnectedLocalServersPanelProps {
  servers: ConnectedLocalServerItem[];
  loading: boolean;
  onLogoutFrontend: () => void;
  onLogoutServer: (sessionId: string) => void;
}

export function ConnectedLocalServersPanel({
  servers,
  loading,
  onLogoutFrontend,
  onLogoutServer,
}: ConnectedLocalServersPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('admin.accessControl.connectedDevices.localServer.panelTitle')}
        </h2>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-xs text-muted-foreground">{t('common.loading')}</span>
          ) : null}
          <AppButton size="sm" variant="secondary" onClick={() => void onLogoutFrontend()}>
            {t('admin.accessControl.connectedDevices.localServer.logoutFrontend')}
          </AppButton>
        </div>
      </div>
      {servers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('admin.accessControl.connectedDevices.localServer.empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {servers.map((server) => (
            <div key={server.id} className="rounded-md border border-border px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {server.displayName?.trim() ||
                      t('admin.accessControl.connectedDevices.localServer.defaultDisplayName')}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t('admin.accessControl.connectedDevices.localServer.sessionMeta', {
                      sessionId: server.id.slice(0, 8),
                      userCode: server.userCode,
                    })}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {server.status}
                </Badge>
              </div>
              <div className="mt-2 flex justify-end">
                <AppButton
                  size="sm"
                  variant="secondary"
                  onClick={() => void onLogoutServer(server.id)}
                >
                  {t('admin.accessControl.connectedDevices.localServer.logout')}
                </AppButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
