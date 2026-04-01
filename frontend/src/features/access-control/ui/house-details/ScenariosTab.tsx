'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { ApiError, scenariosApi } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import type { ScenarioResponse } from '@/types/api';

interface ScenariosTabProps {
  houseId: string | null;
  activeTab: string;
}

export function ScenariosTab({ houseId, activeTab }: ScenariosTabProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [scenariosTotal, setScenariosTotal] = useState(0);
  const [scenariosPage, setScenariosPage] = useState(1);
  const scenariosLimit = 6;
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [scenariosError, setScenariosError] = useState<'none' | 'forbidden' | 'error'>('none');

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
        if (error.status >= 500) {
          showToast(t('common.error'), 'error');
          setError('error');
          return;
        }
      }
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
      try {
        const result = await scenariosApi.getAll({
          houseId,
          page: scenariosPage,
          limit: scenariosLimit,
          signal,
        });
        const normalized = normalizeList<ScenarioResponse>(result);
        if (signal?.aborted) return;
        setScenarios(normalized.items);
        setScenariosTotal(normalized.total);
      } catch (error) {
        if (signal?.aborted) return;
        handleError(error, setScenariosError);
      } finally {
        if (!signal?.aborted) setScenariosLoading(false);
      }
    },
    [handleError, houseId, normalizeList, scenariosLimit, scenariosPage]
  );

  useEffect(() => {
    if (activeTab !== 'scenarios') return;
    const controller = new AbortController();
    void loadScenarios(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadScenarios]);

  const totalPages = (total: number, limit: number) => Math.max(1, Math.ceil(total / limit));
  const scenariosPages = totalPages(scenariosTotal, scenariosLimit);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" size="sm" onClick={() => loadScenarios()}>
          {t('admin.retry')}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t('admin.page')} {scenariosPage} / {scenariosPages}
        </span>
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
        <div className="space-y-3 rounded-xl border border-border bg-card p-8 text-center">
          <span className="text-sm text-muted-foreground">{t('common.error')}</span>
          <Button variant="secondary" size="sm" onClick={() => loadScenarios()}>
            {t('admin.retry')}
          </Button>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('admin.noData')}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <Card key={scenario.id} className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{scenario.name}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {scenario.description || '—'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div>
                  {t('admin.isActive')}: {scenario.isActive ? t('common.yes') : t('common.no')}
                </div>
                <div>
                  {t('admin.lastRun')}: {formatDateTime(scenario.lastRun, locale)}
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
