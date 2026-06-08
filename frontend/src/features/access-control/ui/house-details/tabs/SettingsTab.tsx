'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  HouseMqttConfigUpsertRequest,
  HouseMqttProvisionResponse,
} from '@/types/api';

interface SettingsTabProps {
  houseId: string | null;
  canManage?: boolean;
}

type LoadState = 'idle' | 'loading' | 'error';

const DEFAULT_MQTT_PLACEHOLDER = 'central';

function defaultTopicPrefix(houseId: string | null): string {
  return houseId ? `houses/${houseId}/zigbee2mqtt` : 'zigbee2mqtt';
}

function isGatewayMqttUrl(url: string): boolean {
  return /\/api\/mqtt/i.test(url.trim());
}

function isValidBrokerMqttUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed === 'central') return true;
  try {
    const protocol = new URL(trimmed).protocol;
    return protocol === 'mqtt:' || protocol === 'mqtts:';
  } catch {
    return false;
  }
}

const emptyDraft = (houseId: string | null): HouseMqttConfigUpsertRequest & {
  enabled: boolean;
  topicPrefix: string;
} => ({
  mqttUrl: 'central',
  mqttUsername: '',
  mqttPassword: '',
  enabled: true,
  topicPrefix: defaultTopicPrefix(houseId),
});

export function SettingsTab({ houseId, canManage = true }: SettingsTabProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorDetails, setErrorDetails] = useState<string[] | null>(null);
  const [serverConfig, setServerConfig] = useState<HouseMqttConfigResponse | null>(null);

  const [draft, setDraft] = useState(() => emptyDraft(houseId));
  const [saving, setSaving] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [provisionResult, setProvisionResult] = useState<HouseMqttProvisionResponse | null>(null);

  const connected = Boolean(serverConfig?.status?.connected);

  const hydrateDraft = useCallback((cfg: HouseMqttConfigResponse | null) => {
    if (!cfg) {
      setDraft(emptyDraft(houseId));
      return;
    }
    setDraft({
      mqttUrl: cfg.mqttUrl ?? '',
      mqttUsername: cfg.mqttUsername ?? '',
      mqttPassword: '',
      enabled: cfg.enabled ?? true,
      topicPrefix: cfg.topicPrefix ?? defaultTopicPrefix(houseId),
    });
  }, [houseId]);

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
        hydrateDraft(cfg);
        setLoadState('idle');
      } catch (error) {
        if (signal?.aborted) return;
        if (error instanceof ApiError && error.status === 404) {
          setServerConfig(null);
          hydrateDraft(null);
          setLoadState('idle');
          return;
        }
        setServerConfig(null);
        hydrateDraft(null);
        handleError(error);
      }
    },
    [handleError, houseId, hydrateDraft],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const mqttUrlIssue = useMemo(() => {
    const url = draft.mqttUrl.trim();
    if (!url) return 'empty' as const;
    if (isGatewayMqttUrl(url)) return 'gateway' as const;
    if (!isValidBrokerMqttUrl(url)) return 'invalid' as const;
    return null;
  }, [draft.mqttUrl]);

  const isValid = mqttUrlIssue === null;

  const onSave = useCallback(async () => {
    if (!houseId) return;
    setSaving(true);
    try {
      const dto: HouseMqttConfigUpsertRequest = {
        mqttUrl: draft.mqttUrl.trim(),
        topicPrefix: draft.topicPrefix.trim() || defaultTopicPrefix(houseId),
        enabled: Boolean(draft.enabled),
        ...(draft.mqttUsername?.trim() ? { mqttUsername: draft.mqttUsername.trim() } : {}),
        ...(draft.mqttPassword?.trim() ? { mqttPassword: draft.mqttPassword.trim() } : {}),
      };
      const cfg = await houseMqttApi.upsert(houseId, dto);
      setServerConfig(cfg);
      hydrateDraft(cfg);
      if (cfg.enabled && !cfg.status?.connected) {
        const detail = formatMqttLastError(cfg);
        showToast(
          detail
            ? (locale === 'ru'
                ? `Сохранено, но MQTT не подключён: ${detail}`
                : `Saved, but MQTT is not connected: ${detail}`)
            : (locale === 'ru'
                ? 'Сохранено, но MQTT не подключён'
                : 'Saved, but MQTT is not connected'),
          'error',
        );
      } else {
        showToast(locale === 'ru' ? 'Настройки сохранены' : 'Settings saved', 'success');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  }, [draft, handleError, houseId, hydrateDraft, locale, showToast]);

  const onProvision = useCallback(async () => {
    if (!houseId) return;
    setProvisioning(true);
    try {
      const result = await houseMqttApi.provision(houseId);
      setProvisionResult(result);
      setServerConfig(result.config);
      hydrateDraft(result.config);
      setDraft((prev) => ({
        ...prev,
        mqttUrl: result.mqttUrl,
        mqttUsername: result.username,
        mqttPassword: result.password,
        topicPrefix: result.topicPrefix,
        enabled: true,
      }));
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
  }, [handleError, houseId, hydrateDraft, showToast, t]);

  const copyProvisionCredentials = useCallback(async () => {
    if (!provisionResult) return;
    const text = [
      `MQTT URL: central`,
      `Username: ${provisionResult.username}`,
      `Password: ${provisionResult.password}`,
      `Topic prefix: ${provisionResult.topicPrefix}`,
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
      hydrateDraft(cfg);
      await load();
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
  }, [handleError, houseId, load, locale, showToast]);

  const onDelete = useCallback(async () => {
    if (!houseId) return;
    setDeleting(true);
    try {
      await houseMqttApi.delete(houseId);
      setServerConfig(null);
      hydrateDraft(null);
      showToast(locale === 'ru' ? 'Конфигурация удалена' : 'Configuration deleted', 'success');
    } catch (error) {
      handleError(error);
    } finally {
      setDeleting(false);
    }
  }, [handleError, houseId, hydrateDraft, locale, showToast]);

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
            ? 'Не удалось загрузить настройки подключения к локальному серверу.'
            : 'Failed to load local server connection settings.'
        }
        details={errorDetails ?? undefined}
        onRetry={() => void load()}
      />
    );
  }

  const statusLabel = connected ? (locale === 'ru' ? 'Подключено' : 'Connected') : (locale === 'ru' ? 'Не подключено' : 'Disconnected');
  const mqttLastError = serverConfig?.status?.lastError?.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h1 className="text-sm font-semibold text-foreground">
            {locale === 'ru' ? 'Настройки дома' : 'House settings'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {locale === 'ru'
              ? 'URL локального сервера/брокера Zigbee2MQTT для этого дома.'
              : 'Local server / Zigbee2MQTT broker URL for this house.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'default' : 'secondary'}>{statusLabel}</Badge>
          <Button variant="secondary" size="sm" onClick={() => load()} disabled={saving || reconnecting || deleting}>
            {t('admin.retry')}
          </Button>
        </div>
      </div>

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            {locale === 'ru' ? 'Подключение к локальному серверу' : 'Local server connection'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t('admin.accessControl.connectedDevices.houseMqttSettings.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {locale === 'ru' ? 'Включено' : 'Enabled'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {locale === 'ru'
                  ? 'Если выключить — соединение будет разорвано.'
                  : 'If disabled, the connection will be closed.'}
              </p>
            </div>
            <Switch
              checked={Boolean(draft.enabled)}
              onCheckedChange={(v) => setDraft((prev) => ({ ...prev, enabled: v }))}
              aria-label={locale === 'ru' ? 'Включить соединение' : 'Enable connection'}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <p className="text-xs font-medium text-foreground">MQTT URL</p>
              <Input
                placeholder={DEFAULT_MQTT_PLACEHOLDER}
                value={draft.mqttUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, mqttUrl: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">
                {t('admin.accessControl.connectedDevices.houseMqttSettings.brokerHint')}
              </p>
              {mqttUrlIssue === 'gateway' ? (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  {t('admin.accessControl.connectedDevices.houseMqttSettings.gatewayUrlWarning')}
                </p>
              ) : null}
              {mqttUrlIssue === 'invalid' ? (
                <p className="text-[11px] text-destructive">
                  {t('admin.accessControl.connectedDevices.houseMqttSettings.invalidUrl')}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground">
                  {locale === 'ru' ? 'Учётные данные EMQX' : 'EMQX credentials'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void onProvision()}
                  disabled={!canManage || provisioning || saving || reconnecting || deleting}
                >
                  {provisioning
                    ? (locale === 'ru' ? 'Генерация…' : 'Generating…')
                    : t('admin.accessControl.connectedDevices.houseMqttSettings.generateCredentials')}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('admin.accessControl.connectedDevices.houseMqttSettings.generateCredentialsHint')}
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">
                {locale === 'ru' ? 'Логин' : 'Username'}
              </p>
              <Input
                placeholder={locale === 'ru' ? 'username' : 'username'}
                value={draft.mqttUsername ?? ''}
                onChange={(e) => setDraft((prev) => ({ ...prev, mqttUsername: e.target.value }))}
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">
                {locale === 'ru' ? 'Пароль (опционально)' : 'Password (optional)'}
              </p>
              <Input
                type="password"
                placeholder={locale === 'ru' ? '••••••••' : '••••••••'}
                value={draft.mqttPassword ?? ''}
                onChange={(e) => setDraft((prev) => ({ ...prev, mqttPassword: e.target.value }))}
                autoComplete="current-password"
              />
              <p className="text-[11px] text-muted-foreground">
                {serverConfig?.hasMqttPassword
                  ? (locale === 'ru'
                      ? 'Пароль сохранён. Оставь поле пустым, чтобы не менять, или нажми «Сгенерировать в EMQX».'
                      : 'Password is stored. Leave empty to keep it, or use Generate in EMQX.')
                  : (locale === 'ru'
                      ? 'Пароль не задан. Нажми «Сгенерировать в EMQX» или введи вручную.'
                      : 'No password set. Use Generate in EMQX or enter manually.')}
              </p>
            </div>
          </div>

          {mqttLastError ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              {locale === 'ru' ? 'Ошибка MQTT: ' : 'MQTT error: '}
              {mqttLastError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={!canManage || saving || !isValid || reconnecting || deleting || provisioning}>
              {saving ? (locale === 'ru' ? 'Сохранение…' : 'Saving…') : t('common.save')}
            </Button>
            <Button
              variant="secondary"
              onClick={onReconnect}
              disabled={!canManage || reconnecting || saving || deleting || !serverConfig}
            >
              {reconnecting ? (locale === 'ru' ? 'Переподключение…' : 'Reconnecting…') : (locale === 'ru' ? 'Переподключить' : 'Reconnect')}
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={!canManage || deleting || saving || reconnecting || !serverConfig}
            >
              {deleting ? (locale === 'ru' ? 'Удаление…' : 'Deleting…') : (locale === 'ru' ? 'Удалить конфигурацию' : 'Delete config')}
            </Button>
          </div>
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

