'use client';

import { ThemeInitializer } from '@/components/shared';
import { useTranslation, useCurrentUserId } from '@/hooks';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Activity, Home, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { accessApiClient, physicalDevicesApi, scenariosApi, zigbeeDevicesApi } from '@/lib/api-client';
import type { HouseResponse, PhysicalDeviceResponse } from '@/types/api';
import { toArray } from '@/features/access-control';
import { DashboardHouseCard } from '@/features/dashboard/ui/DashboardHouseCard';

type EventResult = 'SUCCESS' | 'DENIED' | 'ERROR';

interface DashboardEvent {
  id: string;
  timestamp: string;
  house: string;
  device: string;
  action: string;
  result: EventResult;
}

const PREVIEW_HOUSES_LIMIT = 6;

export default function DashboardPage() {
  const { t, ready } = useTranslation();
  const currentUserId = useCurrentUserId();
  const [houses, setHouses] = useState<HouseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalDevices, setTotalDevices] = useState(0);
  const [totalActiveScenarios, setTotalActiveScenarios] = useState(0);
  const [recentEvents, setRecentEvents] = useState<DashboardEvent[]>([]);
  const [eventsCount, setEventsCount] = useState(0);

  const loadData = useCallback(async () => {
    if (currentUserId == null) return;
    setLoading(true);
    try {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [housesData, devicesCountData, scenariosData, allDevicesData, logsData] = await Promise.all([
        accessApiClient.houses.getHousesByUser(currentUserId, { page: 0, size: PREVIEW_HOUSES_LIMIT }),
        physicalDevicesApi.getAll({ limit: 1 }),
        scenariosApi.getAll({ status: 'ONLINE', limit: 1 }),
        physicalDevicesApi.getAll({ limit: 100 }),
        zigbeeDevicesApi.listDeviceLogs({ from: since24h, limit: 5 }),
      ]);

      const fetchedHouses = toArray<HouseResponse>(housesData);
      setHouses(fetchedHouses);
      setTotalDevices(devicesCountData.total);
      setTotalActiveScenarios(scenariosData.total);
      setEventsCount(logsData.total);

      // Lookup maps
      const houseById = new Map(fetchedHouses.map((h) => [String(h.id), h.name]));
      const deviceByIeee = new Map<string, PhysicalDeviceResponse>();
      for (const device of allDevicesData.items) {
        if (device.protocolAddress) deviceByIeee.set(device.protocolAddress, device);
      }

      setRecentEvents(
        logsData.items.map((log, i) => {
          const ieeeAddr = String(log['deviceIeeeAddr'] ?? '');
          const physDevice = deviceByIeee.get(ieeeAddr);
          const deviceName = (physDevice?.friendlyName ?? physDevice?.name ?? ieeeAddr) || '—';
          const houseId = physDevice?.houseId != null ? String(physDevice.houseId) : null;
          const houseName = houseId ? (houseById.get(houseId) ?? '—') : '—';
          const rawKind = String(log['kind'] ?? log['source'] ?? '');

          return {
            id: String(log['id'] ?? log['_id'] ?? i),
            timestamp: String(log['timestamp'] ?? log['createdAt'] ?? new Date().toISOString()),
            house: houseName,
            device: deviceName,
            action: rawKind,
            result: 'SUCCESS' as EventResult,
          };
        }),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  const translateAction = (raw: string) => {
    const key = `dashboard.recentEvents.actions.${raw}` as const;
    const translated = t(key as Parameters<typeof t>[0]);
    return translated !== key ? translated : raw || '—';
  };

  const translateResult = (result: EventResult) =>
    t(`dashboard.recentEvents.results.${result}` as Parameters<typeof t>[0]);

  const resultClass = (result: EventResult) => {
    switch (result) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'DENIED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  return (
    <>
      <ThemeInitializer />

      {/* Stats */}
      <section className="mb-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border border-border bg-card shadow">
            <Card.Content className="flex items-center gap-3 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.stats.totalDevices')}</p>
                <p className="text-2xl font-bold">{totalDevices}</p>
              </div>
            </Card.Content>
          </Card>
          <Card className="border border-border bg-card shadow">
            <Card.Content className="flex items-center gap-3 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.stats.activeScenarios')}</p>
                <p className="text-2xl font-bold">{totalActiveScenarios}</p>
              </div>
            </Card.Content>
          </Card>
          <Card className="border border-border bg-card shadow">
            <Card.Content className="flex items-center gap-3 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.stats.events24h')}</p>
                <p className="text-2xl font-bold">{eventsCount}</p>
              </div>
            </Card.Content>
          </Card>
        </div>
      </section>

      {/* Houses */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t('dashboard.myHouses')}</h2>
          <Link
            href="/dashboard/houses"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t('dashboard.viewAll')}
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : houses.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-center text-muted-foreground">
            {t('dashboard.noHouses')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {houses.map((house) => (
              <DashboardHouseCard key={house.id} house={house} basePath="/dashboard/houses" />
            ))}
          </div>
        )}
      </section>

      {/* Recent Events */}
      <section>
        <Card className="border border-border bg-card shadow">
          <Card.Content className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('dashboard.recentEvents.title')}</h2>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
              >
                {t('dashboard.recentEvents.viewAll')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 font-medium">{t('dashboard.recentEvents.time')}</th>
                    <th className="py-3 px-4 font-medium">{t('dashboard.recentEvents.house')}</th>
                    <th className="py-3 px-4 font-medium">{t('dashboard.recentEvents.device')}</th>
                    <th className="py-3 px-4 font-medium">{t('dashboard.recentEvents.action')}</th>
                    <th className="py-3 px-4 font-medium">{t('dashboard.recentEvents.result')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        {t('dashboard.recentEvents.empty')}
                      </td>
                    </tr>
                  ) : (
                    recentEvents.map((event) => (
                      <tr
                        key={event.id}
                        className="border-b border-border last:border-b-0 hover:bg-muted/50"
                      >
                        <td className="py-3 px-4">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">{event.house}</td>
                        <td className="py-3 px-4">{event.device}</td>
                        <td className="py-3 px-4">{translateAction(event.action)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex rounded px-2 py-1 text-xs font-medium ${resultClass(event.result)}`}
                          >
                            {translateResult(event.result)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>
      </section>
    </>
  );
}
