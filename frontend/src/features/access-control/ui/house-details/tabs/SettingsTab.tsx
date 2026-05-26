'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceErrorCard, useToast } from '@/components/shared';
import { ApiError, houseMqttApi } from '@/lib/api-client';
import { useTranslation } from '@/hooks';
import type { HouseMqttConfigResponse, HouseMqttConfigUpsertRequest } from '@/types/api';

interface SettingsTabProps {
  houseId: string | null;
  canManage?: boolean;
}

type LoadState = 'idle' | 'loading' | 'error';

const emptyDraft = (): HouseMqttConfigUpsertRequest & {
  enabled: boolean;
  topicPrefix: string;
} => ({
  mqttUrl: '',
  mqttUsername: '',
  mqttPassword: '',
  enabled: true,
  topicPrefix: 'zigbee2mqtt',
});

export function SettingsTab({ houseId, canManage = true }: SettingsTabProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorDetails, setErrorDetails] = useState<string[] | null>(null);
  const [serverConfig, setServerConfig] = useState<HouseMqttConfigResponse | null>(null);

  const [draft, setDraft] = useState(() => emptyDraft());
  const [saving, setSaving] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const connected = Boolean(serverConfig?.status?.connected);

  const hydrateDraft = useCallback((cfg: HouseMqttConfigResponse | null) => {
    if (!cfg) {
      setDraft(emptyDraft());
      return;
    }
    setDraft({
      mqttUrl: cfg.mqttUrl ?? '',
      mqttUsername: cfg.mqttUsername ?? '',
      mqttPassword: '',
      enabled: cfg.enabled ?? true,
      topicPrefix: cfg.topicPrefix ?? 'zigbee2mqtt',
    });
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
        hydrateDraft(cfg);
        setLoadState('idle');
      } catch (error) {
        if (signal?.aborted) return;
        // If config is not created yet, show empty form (not an error).
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

  const isValid = useMemo(() => {
    const url = draft.mqttUrl.trim();
    if (!url) return false;
    // allow mqtt://, ws://, wss:// and bare host:port (mqtt client will accept some variants)
    return true;
  }, [draft.mqttUrl]);

  const onSave = useCallback(async () => {
    if (!houseId) return;
    setSaving(true);
    try {
      const dto: HouseMqttConfigUpsertRequest = {
        mqttUrl: draft.mqttUrl.trim(),
        topicPrefix: draft.topicPrefix.trim() || 'zigbee2mqtt',
        enabled: Boolean(draft.enabled),
        ...(draft.mqttUsername?.trim() ? { mqttUsername: draft.mqttUsername.trim() } : {}),
        ...(draft.mqttPassword?.trim() ? { mqttPassword: draft.mqttPassword.trim() } : {}),
      };
      const cfg = await houseMqttApi.upsert(houseId, dto);
      setServerConfig(cfg);
      hydrateDraft(cfg);
      showToast(locale === 'ru' ? 'Настройки сохранены' : 'Settings saved', 'success');
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  }, [draft, handleError, houseId, hydrateDraft, locale, showToast]);

  const onReconnect = useCallback(async () => {
    if (!houseId) return;
    setReconnecting(true);
    try {
      await houseMqttApi.reconnect(houseId);
      await load();
      showToast(locale === 'ru' ? 'Переподключение выполнено' : 'Reconnected', 'success');
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
            {locale === 'ru'
              ? 'Эти настройки используются scenario-service для подключения по MQTT и получения телеметрии.'
              : 'These settings are used by scenario-service to connect over MQTT and ingest telemetry.'}
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
                placeholder="mqtt://192.168.1.10:1883"
                value={draft.mqttUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, mqttUrl: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">
                {locale === 'ru'
                  ? 'Пример: mqtt://192.168.1.10:1883 (Mosquitto/Zigbee2MQTT).'
                  : 'Example: mqtt://192.168.1.10:1883 (Mosquitto/Zigbee2MQTT).'}
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">
                {locale === 'ru' ? 'Логин (опционально)' : 'Username (optional)'}
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
                {locale === 'ru'
                  ? 'Пароль не возвращается сервером. Оставь пустым, если не хочешь менять.'
                  : 'Password is not returned by the server. Leave empty if you don’t want to change it.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={!canManage || saving || !isValid || reconnecting || deleting}>
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
    </div>
  );
}

