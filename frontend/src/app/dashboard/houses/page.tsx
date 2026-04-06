'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { housesApi, accessApiClient } from '@/lib/api-client';
import type { HouseRequest, HouseResponse } from '@/types/api';
import { toArray } from '@/features/access-control/lib/utils';
import { useTranslation } from '@/hooks';
import { useSession } from 'next-auth/react';
import { useCurrentUserId } from '@/hooks';
import { ThemeInitializer } from '@/components/shared';
import { DashboardHouseCard } from '@/features/dashboard/ui/DashboardHouseCard';
import { HouseFormModal } from '@/features/access-control/ui/modals';

export default function DashboardHousesPage() {
  const router = useRouter();
  const { t, ready } = useTranslation();
  const { status: sessionStatus } = useSession();
  const currentUserId = useCurrentUserId();

  const [searchQuery, setSearchQuery] = useState('');
  const [houses, setHouses] = useState<HouseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [houseFormOpen, setHouseFormOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<HouseResponse | null>(null);

  useEffect(() => {
    if (sessionStatus !== 'loading' && currentUserId === null) {
      router.replace('/dashboard');
    }
  }, [sessionStatus, currentUserId, router]);

  const load = useCallback(async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const data = await accessApiClient.houses.getHousesByUser(currentUserId, { page: 0, size: 50 });
      setHouses(toArray<HouseResponse>(data));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredHouses = houses.filter((house) =>
    house.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveHouse = async (payload: HouseRequest) => {
    if (!currentUserId) return;
    const data: HouseRequest = { ...payload, ownerId: payload.ownerId || currentUserId };
    if (editingHouse) {
      await housesApi.update(editingHouse.id, data);
    } else {
      await housesApi.create(data);
    }
    setEditingHouse(null);
    setHouseFormOpen(false);
    await load();
  };

  const openCreate = () => {
    setEditingHouse(null);
    setHouseFormOpen(true);
  };

  const showLoading = loading && houses.length === 0;

  if (!ready || sessionStatus === 'loading' || currentUserId === null) {
    return (
      <>
        <ThemeInitializer />
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <ThemeInitializer />
      <div className="min-h-[40vh]">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              ← {t('common.back')} {t('navigation.dashboard')}
            </Link>
            <h1 className="text-3xl font-bold">{t('dashboard.myHouses')}</h1>
          </div>
          <Button onClick={openCreate} className="flex shrink-0 items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('admin.accessControl.createHouse')}
          </Button>
        </div>

        {showLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="w-full flex-1 md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={t('common.search')}
                      className="w-full pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredHouses.map((house) => (
                <DashboardHouseCard
                  key={house.id}
                  house={house}
                  basePath="/dashboard/houses"
                />
              ))}
            </div>

            {filteredHouses.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? t('common.noResults') : t('dashboard.noHouses')}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {currentUserId && (
        <HouseFormModal
          isOpen={houseFormOpen}
          onOpenChange={setHouseFormOpen}
          initialValues={editingHouse ?? undefined}
          initialOwnerId={currentUserId}
          onSubmit={saveHouse}
        />
      )}
    </>
  );
}
