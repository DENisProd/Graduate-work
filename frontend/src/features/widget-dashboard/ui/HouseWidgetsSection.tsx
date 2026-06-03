'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentUserId, useTranslation } from '@/hooks';
import type { PhysicalDeviceResponse, ScenarioResponse, ZigbeeDeviceListItem } from '@/types/api';
import type { WidgetDashboard as WidgetDashboardType } from '@/features/widget-dashboard/types/widget.types';
import {
  physicalDevicesApi,
  scenariosApi,
  widgetDashboardsApi,
  zigbeeDevicesApi,
} from '@/lib/api/scenario-service';
import { WidgetDashboard } from '@/features/widget-dashboard/ui/WidgetDashboard';
import { ServiceErrorCard } from '@/components/shared';

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10);
}

type TranslateFn = ReturnType<typeof useTranslation>['t'];

function buildDefaultWidgets(t: TranslateFn) {
  const w1 = nanoid();
  const w2 = nanoid();
  const w3 = nanoid();

  const widgets: WidgetDashboardType['widgets'] = [
    {
      id: w1,
      type: 'TEXT_LABEL',
      config: {
        type: 'TEXT_LABEL',
        text: `${t('dashboard.overview.widgets.weatherTitle')}: ${t('dashboard.overview.widgets.weatherHint')}`,
        align: 'left',
        fontSize: 'lg',
        style: 'title',
      },
    },
    {
      id: w2,
      type: 'TEXT_LABEL',
      config: {
        type: 'TEXT_LABEL',
        text: `${t('dashboard.overview.widgets.automationTitle')}: ${t('dashboard.overview.widgets.automationHint')}`,
        align: 'left',
        fontSize: 'lg',
        style: 'title',
      },
    },
    {
      id: w3,
      type: 'TEXT_LABEL',
      config: {
        type: 'TEXT_LABEL',
        text: `${t('dashboard.overview.widgets.tipTitle')}: ${t('dashboard.overview.widgets.tipBody')}`,
        align: 'left',
        fontSize: 'md',
        style: 'body',
      },
    },
  ];

  const layouts = {
    lg: [
      { i: w1, x: 0, y: 0, w: 8, h: 2, minW: 4, minH: 2 },
      { i: w2, x: 8, y: 0, w: 8, h: 2, minW: 4, minH: 2 },
      { i: w3, x: 16, y: 0, w: 8, h: 3, minW: 4, minH: 2 },
    ],
    md: [
      { i: w1, x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: w2, x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: w3, x: 0, y: 2, w: 12, h: 3, minW: 4, minH: 2 },
    ],
    sm: [
      { i: w1, x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: w2, x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: w3, x: 0, y: 4, w: 6, h: 3, minW: 4, minH: 2 },
    ],
  };

  return { widgets, layouts };
}

export function HouseWidgetsSection({
  houseId,
  titleVariant = 'h2',
  className,
}: {
  houseId: string;
  titleVariant?: 'h2' | 'none';
  className?: string;
}) {
  const { t } = useTranslation();
  const currentUserId = useCurrentUserId();

  const autoLoaded = useRef(false);
  const [dashboard, setDashboard] = useState<WidgetDashboardType | null>(null);
  const [devices, setDevices] = useState<PhysicalDeviceResponse[]>([]);
  const [zigbeeDevices, setZigbeeDevices] = useState<ZigbeeDeviceListItem[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWidgets = useCallback(async () => {
    if (!houseId || !currentUserId) return;
    setLoading(true);
    setError(null);
    try {
      const [dashboards, devRes, zigbeeRes, scRes] = await Promise.all([
        widgetDashboardsApi.getByHouse(houseId),
        physicalDevicesApi.getAll({ houseId, limit: 200 }),
        zigbeeDevicesApi.list({ houseId, limit: 200 }),
        scenariosApi.getAll({ houseId, limit: 100 }),
      ]);

      setDevices(devRes.items ?? []);
      setZigbeeDevices(zigbeeRes.items ?? []);
      setScenarios(scRes.items ?? []);

      if (dashboards.length > 0) {
        setDashboard(dashboards.find((d) => d.isDefault) ?? dashboards[0]);
      } else {
        let created = await widgetDashboardsApi.create({
          houseId,
          name: t('dashboard.widgets.title'),
          isDefault: true,
        });

        if ((created.widgets?.length ?? 0) === 0) {
          const seed = buildDefaultWidgets(t);
          created = await widgetDashboardsApi.update(created.id, {
            widgets: seed.widgets,
            layouts: seed.layouts as unknown as Record<string, unknown>,
          });
        }
        setDashboard(created);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('dashboard.widgets.loadError'));
    } finally {
      setLoading(false);
    }
  }, [currentUserId, houseId, t]);

  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    void loadWidgets();
  }, [loadWidgets]);

  return (
    <section className={className ?? 'mb-8'}>
      {loading ? (
        <div className="flex min-h-[520px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : error ? (
        <ServiceErrorCard
          title={t('dashboard.widgets.loadError')}
          description={error}
          details={[error]}
          onRetry={() => void loadWidgets()}
        />
      ) : dashboard ? (
        <div className="min-h-[520px]">
          <WidgetDashboard
            dashboard={dashboard}
            devices={devices}
            zigbeeDevices={zigbeeDevices}
            scenarios={scenarios}
          />
        </div>
      ) : (
        <div className="flex min-h-[520px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {t('dashboard.widgets.noHouses')}
          </p>
        </div>
      )}
    </section>
  );
}

