'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from '@/hooks';
import { env } from '@/config/env.config';

const GATEWAY_ROUTES = [
  { path: '/api/access', labelKey: 'settings.gateway.accessService' as const },
  { path: '/api/scenario', labelKey: 'settings.gateway.scenarioService' as const },
  { path: '/api/mqtt', labelKey: 'settings.gateway.mqttService' as const },
] as const;

export function GatewaySettingsCard() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.gateway.title')}</CardTitle>
        <CardDescription>{t('settings.gateway.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t('settings.gateway.url')}</p>
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
            {env.GATEWAY_URL}
          </p>
        </div>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {GATEWAY_ROUTES.map(({ path, labelKey }) => (
            <li key={path}>
              <span className="font-mono text-xs text-foreground">
                {env.GATEWAY_URL}
                {path}
              </span>
              {' — '}
              {t(labelKey)}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{t('settings.gateway.localBackendHint')}</p>
      </CardContent>
    </Card>
  );
}
