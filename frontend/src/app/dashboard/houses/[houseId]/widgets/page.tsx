'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { WidgetDashboard } from '@/features/widget-dashboard/ui/WidgetDashboard';
import { widgetDashboardsApi, physicalDevicesApi, scenariosApi, zigbeeDevicesApi } from '@/lib/api/scenario-service';
import { useCurrentUserId } from '@/hooks';
import type { WidgetDashboard as WD } from '@/features/widget-dashboard/types/widget.types';
import type { PhysicalDeviceResponse, ScenarioResponse, ZigbeeDeviceListItem } from '@/types/api';
import { ApiError } from '@/lib/api-client';
import { ServiceErrorCard } from '@/components/shared';

export default function WidgetsPage() {
  const params = useParams();
  const houseId = params.houseId as string;
  const userId = useCurrentUserId();

  const [dashboard, setDashboard] = useState<WD | null>(null);
  const [devices, setDevices] = useState<PhysicalDeviceResponse[]>([]);
  const [zigbeeDevices, setZigbeeDevices] = useState<ZigbeeDeviceListItem[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string[] | null>(null);

  const loadAll = useCallback(async () => {
    if (!houseId || !userId) return;
    setLoading(true);
    setErrorDetails(null);
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
        const defaultDash = dashboards.find((d) => d.isDefault) ?? dashboards[0];
        setDashboard(defaultDash);
      } else {
        // Создаём первый дашборд автоматически
        const created = await widgetDashboardsApi.create({
          houseId,
          userId,
          name: 'Главный',
          isDefault: true,
        });
        setDashboard(created);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) {
        setErrorDetails([
          'Failed to load resource: net::ERR_CONNECTION_REFUSED',
          `details: ${e.message || 'Network error'}`,
        ]);
      } else {
        setErrorDetails([e instanceof Error ? e.message : 'Ошибка загрузки']);
      }
    } finally {
      setLoading(false);
    }
  }, [houseId, userId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (errorDetails) {
    return (
      <div className="p-6">
        <ServiceErrorCard
          title="Сервис сценариев недоступен"
          description="Не удалось загрузить виджеты/устройства/сценарии."
          details={errorDetails}
          onRetry={loadAll}
        />
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="flex flex-col h-full">
      <WidgetDashboard
        dashboard={dashboard}
        devices={devices}
        zigbeeDevices={zigbeeDevices}
        scenarios={scenarios}
      />
    </div>
  );
}
