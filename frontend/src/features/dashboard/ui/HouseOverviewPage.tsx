'use client';

import { Card } from '@/components/ui/card';
import { useTranslation } from '@/hooks';
import { CloudSun, Sparkles, Lightbulb } from 'lucide-react';

export function HouseOverviewPage() {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border border-border bg-card shadow">
          <Card.Content className="flex flex-col gap-2 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
              <CloudSun className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('dashboard.overview.widgets.weatherTitle')}</p>
            <p className="text-xs text-muted-foreground">{t('dashboard.overview.widgets.weatherHint')}</p>
            <p className="text-2xl font-semibold tabular-nums">—°C</p>
          </Card.Content>
        </Card>

        <Card className="border border-border bg-card shadow">
          <Card.Content className="flex flex-col gap-2 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('dashboard.overview.widgets.automationTitle')}</p>
            <p className="text-xs text-muted-foreground">{t('dashboard.overview.widgets.automationHint')}</p>
            <p className="text-2xl font-semibold tabular-nums">—</p>
          </Card.Content>
        </Card>

        <Card className="border border-border bg-card shadow">
          <Card.Content className="flex flex-col gap-2 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('dashboard.overview.widgets.tipTitle')}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('dashboard.overview.widgets.tipBody')}</p>
          </Card.Content>
        </Card>
      </div>
    </section>
  );
}

