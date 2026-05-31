'use client';

import { useCallback, useEffect, useState } from 'react';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { housesApi } from '@/lib/api-client';
import type { HouseRequest, HouseResponse, PageResponse } from '@/types/api';
import { useTranslation } from '@/hooks';
import { HouseFormModal } from './modals';
import { Eye, Pencil } from 'lucide-react';

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

export function AccessControlHouses() {
  const { t } = useTranslation();
  const router = useRouter();

  const [ownerId, setOwnerId] = useState('');
  const [appliedOwnerId, setAppliedOwnerId] = useState('');
  const [houses, setHouses] = useState<HouseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [houseFormOpen, setHouseFormOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<HouseResponse | null>(null);
  const [status, setStatus] = useState('');

  const load = useCallback(async (nextPage: number, nextSize: number, nextOwnerId: string) => {
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
    void load(0, DEFAULT_PAGE_SIZE, '');
  }, [load]);

  useEffect(() => {
    if (ownerId.trim() !== '' || appliedOwnerId === '') return;
    setAppliedOwnerId('');
    void load(0, pageSize, '');
  }, [ownerId, appliedOwnerId, pageSize, load]);

  const handleLoad = () => {
    const nextOwnerId = ownerId.trim();
    setAppliedOwnerId(nextOwnerId);
    void load(0, pageSize, nextOwnerId);
  };

  const handlePageChange = (nextPage: number) => {
    void load(nextPage, pageSize, appliedOwnerId);
  };

  const handleItemsPerPageChange = (nextSize: number) => {
    setPageSize(nextSize);
    void load(0, nextSize, appliedOwnerId);
  };

  const saveHouse = async (payload: HouseRequest) => {
    if (editingHouse) {
      await housesApi.update(editingHouse.id, payload);
    } else {
      await housesApi.create(payload);
    }
    setEditingHouse(null);
    await load(page, pageSize, appliedOwnerId);
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
    router.push(`/admin/access-control/houses/${houseId}`);
  };

  const columns: Column<HouseResponse>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: t('admin.name') },
    {
      key: 'address',
      label: t('admin.description'),
      render: (house) => house.address || '—',
    },
    {
      key: 'ownerId',
      label: t('admin.accessControl.ownerId'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t('admin.accessControl.houses')}</h2>
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
          <AppButton onClick={handleLoad}>{t('admin.accessControl.load')}</AppButton>
        </div>
        <div className="flex items-end">
          <AppButton onClick={openCreate}>{t('admin.create')}</AppButton>
        </div>
      </div>

      <DataTable<HouseResponse>
        data={houses}
        columns={columns}
        loading={loading}
        actions={(house) => (
          <>
            <AppButton
              size="sm"
              aria-label={t('common.open')}
              title={t('common.open')}
              onClick={() => handleOpen(house.id)}
            >
              <Eye className="h-4 w-4" />
            </AppButton>
            <AppButton
              size="sm"
              variant="secondary"
              aria-label={t('admin.edit')}
              title={t('admin.edit')}
              onClick={() => openEdit(house)}
            >
              <Pencil className="h-4 w-4" />
            </AppButton>
          </>
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

      <HouseFormModal
        isOpen={houseFormOpen}
        onOpenChange={setHouseFormOpen}
        initialValues={editingHouse}
        onSubmit={saveHouse}
      />
    </div>
  );
}
