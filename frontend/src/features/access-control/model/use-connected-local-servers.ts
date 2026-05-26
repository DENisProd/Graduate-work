'use client';

import { useCallback, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { ApiError, deviceAuthApi } from '@/lib/api-client';
import type { ConnectedLocalServerItem } from '@/lib/api/access-service';

export function useConnectedLocalServers() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [servers, setServers] = useState<ConnectedLocalServerItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await deviceAuthApi.listConnectedServers();
      setServers(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        return;
      }
      setServers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const logoutServer = useCallback(
    async (sessionId: string) => {
      try {
        await deviceAuthApi.logoutSession(sessionId);
        showToast(t('admin.accessControl.connectedDevices.localServer.logoutSuccess'), 'success');
        await load();
      } catch {
        showToast(t('admin.accessControl.connectedDevices.localServer.logoutError'), 'error');
      }
    },
    [load, showToast, t]
  );

  const logoutFrontend = useCallback(async () => {
    await signOut({ callbackUrl: '/device-auth' });
  }, []);

  return { servers, loading, load, logoutServer, logoutFrontend };
}
