'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceErrorCard, useToast } from '@/components/shared';
import { formatMqttLastError, mqttReconnectToastKey } from '@/features/access-control/lib/mqtt-reconnect-feedback';
import { ApiError, houseMqttApi } from '@/lib/api-client';
import { useTranslation } from '@/hooks';
import type {
  HouseMqttConfigResponse,
  HouseMqttProvisionResponse,
} from '@/types/api';

interface SettingsTabProps {
  houseId: string | null;
  canManage?: boolean;
}

type LoadState = 'idle' | 'loading' | 'error';

function defaultTopicPrefix(houseId: string | null): string {
  return houseId ? `houses/${houseId}/zigbee2mqtt` : 'zigbee2mqtt';
}

export function SettingsTab({ houseId, canManage = true }: SettingsTabProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorDetails, setErrorDetails] = useState<string[] | null>(null);
  const [serverConfig, setServerConfig] = useState<HouseMqttConfigResponse | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [provisionResult, setProvisionResult] = useState<HouseMqttProvisionResponse | null>(null);

  const connected = Boolean(serverConfig?.status?.connected);
  const mqttLastError = serverConfig?.status?.lastError?.trim();

  const hydrateFromConfig = useCallback((cfg: HouseMqttConfigResponse | null) => {
    setEnabled(cfg?.enabled ?? true);
  }, []);

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          router.push('/login');
          return;
        }
        if (error.status === 0) {
          setErrorDetails([
            'Failed to load resource: net::ERR_CONNECTION_REFUSED',
            `details: ${error.message || 'Network error'}`,
          ]);
          setLoadState('error');
          return;
        }
      }
      setErrorDetails(null);
      setLoadState('error');
      showToast(t('common.error'), 'error');
    },
    [router, showToast, t],
  );

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!houseId) return;
      setLoadState('loading');
      setErrorDetails(null);
      try {
        const cfg = await houseMqttApi.get(houseId, { signal });
        if (signal?.aborted) return;
        setServerConfig(cfg);
        hydrateFromConfig(cfg);
        setLoadState('idle');
      } catch (error) {
        if (signal?.aborted) return;
        if (error instanceof ApiError && error.status === 404) {
          setServerConfig(null);
          hydrateFromConfig(null);
          setLoadState('idle');
          return;
        }
        setServerConfig(null);
        hydrateFromConfig(null);
        handleError(error);
      }
    },
    [handleError, houseId, hydrateFromConfig],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const onProvision = useCallback(async () => {
    if (!houseId) return;
    setProvisioning(true);
    try {
      const result = await houseMqttApi.provision(houseId);
      setProvisionResult(result);
      setServerConfig(result.config);
      hydrateFromConfig(result.config);
      if (result.config.status?.connected) {
        showToast(t('admin.accessControl.connectedDevices.houseMqttSettings.provisionSuccess'), 'success');
      } else {
        const detail = formatMqttLastError(result.config);
        showToast(
          detail
            ? `${t('admin.accessControl.connectedDevices.houseMqttSettings.provisionFailed')}: ${detail}`
            : t('admin.accessControl.connectedDevices.houseMqttSettings.provisionFailed'),
          'error',
        );
      }
    } catch (error) {
      handleError(error);
      showToast(t('admin.accessControl.connectedDevices.houseMqttSettings.provisionFailed'), 'error');
    } finally {
      setProvisioning(false);
    }
  }, [handleError, houseId, hydrateFromConfig, showToast, t]);

  const onToggleEnabled = useCallback(
    async (next: boolean) => {
      if (!houseId || !serverConfig) {
        setEnabled(next);
        return;
      }
      setEnabled(next);
      try {
        const cfg = await houseMqttApi.upsert(houseId, {
          mqttUrl: serverConfig.mqttUrl || 'central',
          topicPrefix: serverConfig.topicPrefix || defaultTopicPrefix(houseId),
          enabled: next,
          ...(serverConfig.localServerUsername
            ? { mqttUsername: serverConfig.localServerUsername }
            : {}),
        });
        setServerConfig(cfg);
        hydrateFromConfig(cfg);
      } catch (error) {
        setEnabled(!next);
        handleError(error);
      }
    },
    [handleError, houseId, hydrateFromConfig, serverConfig],
  );

  const copyProvisionCredentials = useCallback(async () => {
    if (!provisionResult) return;
    const text = [
      `Username: ${provisionResult.username}`,
      `Password: ${provisionResult.password}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('admin.accessControl.connectedDevices.houseMqttSettings.credentialsCopied'), 'success');
    } catch {
      showToast(t('common.error'), 'error');
    }
  }, [provisionResult, showToast, t]);

  const onReconnect = useCallback(async () => {
    if (!houseId) return;
    setReconnecting(true);
    try {
      const cfg = await houseMqttApi.reconnect(houseId);
      setServerConfig(cfg);
      hydrateFromConfig(cfg);
      if (mqttReconnectToastKey(cfg) === 'success') {
        showToast(locale === 'ru' ? 'MQTT подключён' : 'MQTT connected', 'success');
      } else {
        const detail = formatMqttLastError(cfg);
        showToast(
          detail
            ? (locale === 'ru' ? `MQTT не подключён: ${detail}` : `MQTT not connected: ${detail}`)
            : (locale === 'ru' ? 'MQTT не подключён' : 'MQTT not connected'),
          'error',
        );
      }
    } catch (error) {
      handleError(error);
    } finally {
      setReconnecting(false);
    }
  }, [handleError, houseId, hydrateFromConfig, locale, showToast]);

  const onDelete = useCallback(async () => {
    if (!houseId) return;
    setDeleting(true);
    try {
      await houseMqttApi.delete(houseId);
      setServerConfig(null);
      hydrateFromConfig(null);
      showToast(locale === 'ru' ? 'Конфигурация удалена' : 'Configuration deleted', 'success');
    } catch (error) {
      handleError(error);
    } finally {
      setDeleting(false);
    }
  }, [handleError, houseId, hydrateFromConfig, locale, showToast]);

  if (!houseId) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('admin.noData')}
      </div>
    );
  }

  if (loadState === 'loading') {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <ServiceErrorCard
        title={locale === 'ru' ? 'Сервис сценариев недоступен' : 'Scenario service is unavailable'}
        description={
          locale === 'ru'
            ? 'Не удалось загрузить настройки MQTT.'
            : 'Failed to load MQTT settings.'
        }
        details={errorDetails ?? undefined}
        onRetry={() => void load()}
      />
    );
  }

  const statusLabel = connected
    ? (locale === 'ru' ? 'Подключено' : 'Connected')
    : (locale === 'ru' ? 'Не подключено' : 'Disconnected');

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-sm font-semibold text-foreground">
          {locale === 'ru' ? 'MQTT' : 'MQTT'}
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'default' : 'secondary'}>{statusLabel}</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void load()}
            disabled={provisioning || reconnecting || deleting}
          >
            {t('admin.retry')}
          </Button>
        </div>
      </div>

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t('admin.accessControl.connectedDevices.houseMqttSettings.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">
              {locale === 'ru' ? 'Включено' : 'Enabled'}
            </span>
            <Switch
              checked={enabled}
              onCheckedChange={(v) => void onToggleEnabled(v)}
              disabled={!canManage || !serverConfig || provisioning}
              aria-label={locale === 'ru' ? 'Включить MQTT' : 'Enable MQTT'}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => void onProvision()}
            disabled={!canManage || provisioning || reconnecting || deleting}
          >
            {provisioning
              ? (locale === 'ru' ? 'Генерация…' : 'Generating…')
              : t('admin.accessControl.connectedDevices.houseMqttSettings.generateCredentials')}
          </Button>

          {serverConfig?.localServerUsername ? (
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">
                {t('admin.accessControl.connectedDevices.houseMqttSettings.localServerUsername')}
              </p>
              <p className="font-mono text-sm">{serverConfig.localServerUsername}</p>
            </div>
          ) : null}

          {mqttLastError ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              {mqttLastError}
            </p>
          ) : null}

          {serverConfig ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void onReconnect()}
                disabled={!canManage || reconnecting || provisioning || deleting}
              >
                {reconnecting
                  ? (locale === 'ru' ? 'Переподключение…' : 'Reconnecting…')
                  : (locale === 'ru' ? 'Переподключить' : 'Reconnect')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => void onDelete()}
                disabled={!canManage || deleting || provisioning || reconnecting}
              >
                {deleting
                  ? (locale === 'ru' ? 'Удаление…' : 'Deleting…')
                  : (locale === 'ru' ? 'Сбросить' : 'Reset')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={provisionResult !== null} onOpenChange={(open) => !open && setProvisionResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('admin.accessControl.connectedDevices.houseMqttSettings.provisionDialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.accessControl.connectedDevices.houseMqttSettings.provisionDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          {provisionResult ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.accessControl.connectedDevices.houseMqttSettings.provisionUsername')}
                </p>
                <p className="font-mono text-sm">{provisionResult.username}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.accessControl.connectedDevices.houseMqttSettings.provisionPassword')}
                </p>
                <p className="break-all font-mono text-sm">{provisionResult.password}</p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => void copyProvisionCredentials()}>
              {t('admin.accessControl.connectedDevices.houseMqttSettings.copyCredentials')}
            </Button>
            <Button type="button" onClick={() => setProvisionResult(null)}>
              {locale === 'ru' ? 'Готово' : 'Done'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
