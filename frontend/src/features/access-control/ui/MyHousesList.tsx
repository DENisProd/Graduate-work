'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { housesApi, accessApiClient } from '@/lib/api-client';
import type { HouseRequest, HouseResponse } from '@/types/api';
import { useTranslation } from '@/hooks';
import { toArray } from '../lib/utils';
import { HouseFormModal } from './modals';
import { Home } from 'lucide-react';

export interface MyHousesListProps {
  /** Current user id (owner). Houses are loaded for this user. */
  currentUserId: string;
  /** Base path for house detail link, e.g. "/dashboard/houses". Resulting link: `${basePath}/${houseId}` */
  basePath?: string;
  /** Show "Create house" and allow editing existing (opens modal). Default true. */
  allowManage?: boolean;
  /** Optional title override. Default uses dashboard.myHouses or admin.accessControl.houses */
  title?: string;
}

export function MyHousesList({
  currentUserId,
  basePath = '/dashboard/houses',
  allowManage = true,
  title,
}: MyHousesListProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [houses, setHouses] = useState<HouseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [houseFormOpen, setHouseFormOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<HouseResponse | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await accessApiClient.houses.getHousesByUser(currentUserId, { page: 0, size: 50 });
      setHouses(toArray<HouseResponse>(data));
      setStatus(t('common.success'));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [currentUserId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const saveHouse = async (payload: HouseRequest) => {
    const data: HouseRequest = { ...payload, ownerId: payload.ownerId };
    if (editingHouse) {
      await housesApi.update(editingHouse.id, data);
    } else {
      await housesApi.create(data);
    }
    setEditingHouse(null);
    await load();
  };

  const openCreate = () => {
    setEditingHouse(null);
    setHouseFormOpen(true);
  };

  const openEdit = (house: HouseResponse) => {
    setEditingHouse(house);
    setHouseFormOpen(true);
  };

  const handleOpen = (houseId: number) => {
    router.push(`${basePath}/${houseId}`);
  };

  const displayTitle = title ?? t('dashboard.myHouses');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{displayTitle}</h2>
        <div className="flex items-center gap-2">
          {allowManage && (
            <AppButton onClick={openCreate} variant="primary">
              {t('admin.create')}
            </AppButton>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : houses.length === 0 ? (
        <p className="text-muted-foreground">
          {allowManage
            ? t('dashboard.noHousesCreate')
            : t('dashboard.noHouses')}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {houses.map((house) => {
            const imageUrl = house.avatarUrl ?? house.ownerAvatarUrl;
            return (
              <div
                key={house.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-xl"
                onClick={() => handleOpen(house.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleOpen(house.id)}
              >
                <Card className="h-full border border-border shadow-md transition-shadow hover:shadow-lg">
                  <div
                    role="img"
                    aria-label={house.name}
                    className={`relative mx-6 aspect-[16/9] overflow-hidden rounded-lg border border-border ${
                      imageUrl
                        ? 'bg-cover bg-center'
                        : 'bg-gradient-to-br from-muted to-muted/40'
                    }`}
                    style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
                  >
                    {!imageUrl && (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Home className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{house.name}</CardTitle>
                      <CardDescription>{house.address}</CardDescription>
                    </div>
                    <Badge variant="outline">{house.ownerId}</Badge>
                  </CardHeader>
                  <CardFooter className="flex gap-2">
                    <AppButton
                      size="sm"
                      variant="primary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpen(house.id);
                      }}
                    >
                      {t('admin.accessControl.manageHouse')}
                    </AppButton>
                    {allowManage && (
                      <AppButton
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEdit(house);
                        }}
                      >
                        {t('admin.edit')}
                      </AppButton>
                    )}
                  </CardFooter>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {allowManage && (
        <HouseFormModal
          isOpen={houseFormOpen}
          onOpenChange={setHouseFormOpen}
          initialValues={editingHouse ?? undefined}
          initialOwnerId={currentUserId}
          onSubmit={saveHouse}
        />
      )}
    </div>
  );
}
