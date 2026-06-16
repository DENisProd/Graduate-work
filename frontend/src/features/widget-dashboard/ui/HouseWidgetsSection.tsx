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
import { buildDefaultWidgets } from '@/features/widget-dashboard/lib/build-default-widgets';

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

      const loadedDevices = devRes.items ?? [];
      const loadedScenarios = scRes.items ?? [];

      setDevices(loadedDevices);
      setZigbeeDevices(zigbeeRes.items ?? []);
      setScenarios(loadedScenarios);

      if (dashboards.length > 0) {
        setDashboard(dashboards.find((d) => d.isDefault) ?? dashboards[0]);
      } else {
        let created = await widgetDashboardsApi.create({
          houseId,
          name: t('dashboard.widgets.title'),
          isDefault: true,
        });

        if ((created.widgets?.length ?? 0) === 0) {
          const seed = buildDefaultWidgets({
            t,
            houseId,
            devices: loadedDevices,
            scenarios: loadedScenarios,
          });
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
