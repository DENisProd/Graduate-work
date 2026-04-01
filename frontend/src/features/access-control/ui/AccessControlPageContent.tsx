'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { housesApi } from '@/lib/api-client';
import type { HouseResponse, PageResponse } from '@/types/api';
import { useTranslation } from '@/hooks';

const DEFAULT_PAGE_SIZE = 10;

type HousesPayload = HouseResponse[] | PageResponse<HouseResponse>;

function normalizeHousePage(
  data: HousesPayload,
  fallbackPage: number,
  fallbackSize: number
): { items: HouseResponse[]; page: number; totalPages: number; totalItems: number } {
  if (Array.isArray(data)) {
    const totalItems = data.length;
    return {
      items: data,
      page: fallbackPage,
      totalPages: Math.max(1, Math.ceil(totalItems / fallbackSize)),
      totalItems,
    };
  }

  const items = Array.isArray(data.content) ? data.content : [];
  const totalItems = typeof data.totalElements === 'number' ? data.totalElements : items.length;
  const totalPagesFromApi = typeof data.totalPages === 'number' ? data.totalPages : undefined;
  const totalPages = Math.max(1, totalPagesFromApi ?? Math.ceil(totalItems / fallbackSize));
  const page = typeof data.page === 'number' ? data.page : fallbackPage;

  return { items, page, totalPages, totalItems };
}

export function AccessControlPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const [ownerId, setOwnerId] = useState('');
  const [appliedOwnerId, setAppliedOwnerId] = useState('');
  const [houses, setHouses] = useState<HouseResponse[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadHouses = useCallback(async (nextPage: number, nextSize: number, nextOwnerId: string) => {
    setLoading(true);
    try {
      const payload = nextOwnerId
        ? await housesApi.getByOwnerAdmin(nextOwnerId, { page: nextPage, size: nextSize })
        : await housesApi.getAllAdmin({ page: nextPage, size: nextSize });
      const normalized = normalizeHousePage(payload, nextPage, nextSize);
      setHouses(normalized.items);
      setPage(normalized.page);
      setTotalPages(normalized.totalPages);
      setTotalItems(normalized.totalItems);
      setStatus(t('common.success'));
    } catch (error) {
      console.error(error);
      setHouses([]);
      setTotalItems(0);
      setTotalPages(1);
      setStatus(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadHouses(0, DEFAULT_PAGE_SIZE, '');
  }, [loadHouses]);

  useEffect(() => {
    if (ownerId.trim() !== '' || appliedOwnerId === '') return;
    setAppliedOwnerId('');
    void loadHouses(0, pageSize, '');
  }, [ownerId, appliedOwnerId, pageSize, loadHouses]);

  const handleLoadClick = () => {
    const nextOwnerId = ownerId.trim();
    setAppliedOwnerId(nextOwnerId);
    void loadHouses(0, pageSize, nextOwnerId);
  };

  const handlePageChange = (nextPage: number) => {
    void loadHouses(nextPage, pageSize, appliedOwnerId);
  };

  const handleItemsPerPageChange = (nextSize: number) => {
    setPageSize(nextSize);
    void loadHouses(0, nextSize, appliedOwnerId);
  };

  const openHouse = (houseId: number) => {
    const query = appliedOwnerId ? `?ownerId=${encodeURIComponent(appliedOwnerId)}` : '';
    router.push(`/admin/access-control/houses/${houseId}${query}`);
  };

  const columns = useMemo<Column<HouseResponse>[]>(() => [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: t('admin.name'),
      render: (house) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{house.name}</div>
          <div className="truncate text-xs text-muted-foreground">{house.address || '—'}</div>
        </div>
      ),
    },
    {
      key: 'ownerId',
      label: t('admin.accessControl.ownerId'),
    },
  ], [t]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t('admin.accessControl.title')}</h2>
        {status && <Badge variant="secondary">{status}</Badge>}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <label htmlFor="owner-id" className="text-sm font-medium text-foreground">
            {t('admin.accessControl.ownerId')}
          </label>
          <Input
            id="owner-id"
            placeholder={t('admin.accessControl.placeholders.ownerId')}
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <AppButton onClick={handleLoadClick}>{t('admin.accessControl.load')}</AppButton>
        </div>
      </div>

        <DataTable<HouseResponse>
          data={houses}
          columns={columns}
          loading={loading}
          actions={(house) => (
            <AppButton size="sm" onClick={() => openHouse(house.id)}>
              {t('common.open')}
            </AppButton>
          )}
          pagination={{
            page,
            totalPages,
            totalItems,
            itemsPerPage: pageSize,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handleItemsPerPageChange,
          }}
        />
    </div>
  );
}
