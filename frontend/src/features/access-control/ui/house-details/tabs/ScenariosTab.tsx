'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks';
import { ServiceErrorCard, useToast } from '@/components/shared';
import { ApiError, scenariosApi } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import type { ScenarioResponse } from '@/types/api';
import {
  type ScenarioActionV1,
  type ScenarioConditionV1,
  type ScenarioDefinitionV1,
  type ScenarioStatus,
  type ScenarioTriggerV1,
} from '@/features/access-control/model/scenario-definition-v1';

interface ScenariosTabProps {
  houseId: string | null;
  activeTab: string;
  canManage?: boolean;
}

type UiScenario = ScenarioResponse & {
  definition?: ScenarioDefinitionV1;
};

const asDefinitionV1 = (v: unknown): ScenarioDefinitionV1 | undefined => {
  if (!v || typeof v !== 'object') return undefined;
  const obj = v as Record<string, unknown>;
  if (obj.version !== 1) return undefined;
  return v as ScenarioDefinitionV1;
};

export function ScenariosTab({ houseId, activeTab, canManage = true }: ScenariosTabProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const [scenarios, setScenarios] = useState<UiScenario[]>([]);
  const [scenariosTotal, setScenariosTotal] = useState(0);
  const [scenariosPage, setScenariosPage] = useState(1);
  const scenariosLimit = 6;
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [scenariosError, setScenariosError] = useState<'none' | 'forbidden' | 'error'>('none');
  const [scenariosErrorDetails, setScenariosErrorDetails] = useState<string[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | 'ALL'>('ALL');
  const [creatorIdFilter, setCreatorIdFilter] = useState<string>('');

  const normalizeList = useCallback(<T,>(result: unknown) => {
    if (Array.isArray(result)) {
      return { items: result as T[], total: result.length };
    }
    if (result && typeof result === 'object') {
      const obj = result as Record<string, unknown>;
      if (Array.isArray(obj.items)) {
        return {
          items: obj.items as T[],
          total: typeof obj.total === 'number' ? obj.total : (obj.items as T[]).length,
        };
      }
      if (Array.isArray(obj.data)) {
        return {
          items: obj.data as T[],
          total: typeof obj.total === 'number' ? obj.total : (obj.data as T[]).length,
        };
      }
      if (Array.isArray(obj.content)) {
        return {
          items: obj.content as T[],
          total: typeof obj.totalElements === 'number' ? obj.totalElements : (obj.content as T[]).length,
        };
      }
    }
    return { items: [] as T[], total: 0 };
  }, []);

  const handleError = useCallback(
    (error: unknown, setError: (state: 'none' | 'forbidden' | 'error') => void) => {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          router.push('/login');
          return;
        }
        if (error.status === 403) {
          setError('forbidden');
          return;
        }
        if (error.status === 0) {
          setScenariosErrorDetails([
            'Failed to load resource: net::ERR_CONNECTION_REFUSED',
            `details: ${error.message || 'Network error'}`,
          ]);
          setError('error');
          return;
        }
        if (error.status >= 500) {
          showToast(t('common.error'), 'error');
          setError('error');
          return;
        }
      }
      setScenariosErrorDetails(null);
      showToast(t('common.error'), 'error');
      setError('error');
    },
    [router, showToast, t]
  );

  const loadScenarios = useCallback(
    async (signal?: AbortSignal) => {
      if (!houseId) return;
      setScenariosLoading(true);
      setScenariosError('none');
      setScenariosErrorDetails(null);
      try {
        const result = await scenariosApi.getAll({
          houseId,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          creatorId: creatorIdFilter.trim() ? creatorIdFilter.trim() : undefined,
          page: scenariosPage,
          limit: scenariosLimit,
          signal,
        });
        const normalized = normalizeList<ScenarioResponse>(result);
        if (signal?.aborted) return;
        setScenarios(
          normalized.items.map((s) => ({
            ...s,
            definition: asDefinitionV1((s as any).definition),
          }))
        );
        setScenariosTotal(normalized.total);
      } catch (error) {
        if (signal?.aborted) return;
        handleError(error, setScenariosError);
      } finally {
        if (!signal?.aborted) setScenariosLoading(false);
      }
    },
    [creatorIdFilter, handleError, houseId, normalizeList, scenariosLimit, scenariosPage, statusFilter]
  );

  useEffect(() => {
    if (activeTab !== 'scenarios') return;
    const controller = new AbortController();
    void loadScenarios(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadScenarios, scenariosPage]);

  useEffect(() => {
    if (activeTab !== 'scenarios') return;
    setScenariosPage(1);
  }, [activeTab, houseId, statusFilter, creatorIdFilter]);

  const totalPages = (total: number, limit: number) => Math.max(1, Math.ceil(total / limit));
  const scenariosPages = totalPages(scenariosTotal, scenariosLimit);

  const openCreate = useCallback(() => {
    if (!houseId) return;
    router.push(`/admin/access-control/houses/${encodeURIComponent(houseId)}/scenarios/new`);
  }, [houseId, router]);

  const openEdit = useCallback(
    (scenario: UiScenario) => {
      if (!houseId) return;
      router.push(
        `/admin/access-control/houses/${encodeURIComponent(houseId)}/scenarios/${encodeURIComponent(scenario.id)}`
      );
    },
    [houseId, router]
  );

  const setOnline = useCallback(async (scenario: UiScenario, online: boolean) => {
    const nextStatus: ScenarioStatus = online ? 'ONLINE' : 'OFFLINE';
    try {
      await scenariosApi.update(scenario.id, { status: nextStatus });
      await loadScenarios();
    } catch (error) {
      handleError(error, () => {});
    }
  }, [handleError, loadScenarios]);

  const statusBadge = (status: ScenarioStatus) => {
    const variant = status === 'ONLINE' ? 'default' : status === 'ERROR' ? 'destructive' : 'outline';
    return <Badge variant={variant as any}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => loadScenarios()}>
            {t('admin.retry')}
          </Button>
          {canManage && (
            <Button size="sm" onClick={openCreate} disabled={!houseId}>
              {locale === 'ru' ? 'Создать сценарий' : 'Create scenario'}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{locale === 'ru' ? 'Статус' : 'Status'}</span>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[140px]" size="sm">
                <SelectValue placeholder={locale === 'ru' ? 'Все' : 'All'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{locale === 'ru' ? 'Все' : 'All'}</SelectItem>
                <SelectItem value="ONLINE">ONLINE</SelectItem>
                <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground">
            {t('admin.page')} {scenariosPage} / {scenariosPages}
          </span>
        </div>
      </div>
      {scenariosLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : scenariosError === 'forbidden' ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('errors.unauthorized')}
        </div>
      ) : scenariosError === 'error' ? (
        <ServiceErrorCard
          title={locale === 'ru' ? 'Сервис сценариев недоступен' : 'Scenario service is unavailable'}
          description={locale === 'ru' ? 'Не удалось загрузить сценарии.' : 'Failed to load scenarios.'}
          details={scenariosErrorDetails ?? undefined}
          onRetry={() => loadScenarios()}
        />
      ) : scenarios.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('admin.noData')}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <Card key={scenario.id} className="border border-border bg-card shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{scenario.name}</CardTitle>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={scenario.status === 'ONLINE'}
                        onCheckedChange={(checked) => setOnline(scenario, checked)}
                        disabled={scenario.status === 'ERROR'}
                        aria-label={
                          locale === 'ru'
                            ? 'Включить или выключить сценарий'
                            : 'Enable or disable scenario'
                        }
                      />
                    </div>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  {scenario.description || '—'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(scenario)}>
                    {locale === 'ru' ? 'Открыть' : 'Open'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {scenariosPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={scenariosPage <= 1}
            onClick={() => setScenariosPage((prev) => Math.max(1, prev - 1))}
          >
            {t('admin.previous')}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t('admin.page')} {scenariosPage} / {scenariosPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={scenariosPage >= scenariosPages}
            onClick={() => setScenariosPage((prev) => Math.min(scenariosPages, prev + 1))}
          >
            {t('admin.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
