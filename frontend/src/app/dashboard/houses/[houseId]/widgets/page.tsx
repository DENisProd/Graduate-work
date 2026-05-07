'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { WidgetDashboard } from '@/features/widget-dashboard/ui/WidgetDashboard';
import { widgetDashboardsApi, physicalDevicesApi, scenariosApi, zigbeeDevicesApi } from '@/lib/api/scenario-service';
import { useCurrentUserId } from '@/hooks';
import type { WidgetDashboard as WD } from '@/features/widget-dashboard/types/widget.types';
import type { PhysicalDeviceResponse, ScenarioResponse, ZigbeeDeviceListItem } from '@/types/api';

export default function WidgetsPage() {
  const params = useParams();
  const houseId = params.houseId as string;
  const userId = useCurrentUserId();

  const [dashboard, setDashboard] = useState<WD | null>(null);
  const [devices, setDevices] = useState<PhysicalDeviceResponse[]>([]);
  const [zigbeeDevices, setZigbeeDevices] = useState<ZigbeeDeviceListItem[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!houseId || !userId) return;
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
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={loadAll}
          className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
        >
          Повторить
        </button>
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
