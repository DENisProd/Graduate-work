'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { devicesApi, deviceCategoriesApi } from '@/lib/api-client';
import type {
  DeviceResponse,
  DeviceRequest,
  DeviceCategoryResponse,
} from '@/types/api';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DeviceFormModal, DeviceDeleteModal } from './devices';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/animate-ui/components/animate/tooltip';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function DevicesAdmin() {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [categories, setCategories] = useState<DeviceCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDevice, setDeletingDevice] = useState<DeviceResponse | null>(null);
  const [formData, setFormData] = useState<DeviceRequest>({
    code: '',
    deviceCategoryId: 0,
    translations: {
      en: { locale: 'en', name: '', description: '' },
      ru: { locale: 'ru', name: '', description: '' },
    },
  });

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadData();
  }, [page, itemsPerPage]);

  useEffect(() => {
    loadCategories();
  }, []);

  /** Get display name for current locale from translations (supports ru, en and ru_RU, en_US keys). */
  const getNameForLocale = useCallback(
    (
      translations: Record<string, { name?: string }> | undefined,
      fallbackName?: string
    ): string => {
      if (!translations) return fallbackName ?? '';
      const exact = translations[locale]?.name;
      if (exact) return exact;
      const lower = locale.toLowerCase();
      const key = Object.keys(translations).find(
        (k) => k.toLowerCase() === lower || k.toLowerCase().startsWith(lower + '_')
      );
      if (key && translations[key]?.name) return translations[key].name;
      return translations.ru?.name ?? translations.en?.name ?? fallbackName ?? '';
    },
    [locale]
  );

  const loadCategories = async () => {
    try {
      const data = await deviceCategoriesApi.getAll();
      let categoriesArray: DeviceCategoryResponse[] = [];
      if (Array.isArray(data)) {
        categoriesArray = data;
      } else if (data && typeof data === 'object') {
        const d = data as { content?: DeviceCategoryResponse[]; data?: DeviceCategoryResponse[] };
        if (Array.isArray(d.content)) categoriesArray = d.content;
        else if (Array.isArray(d.data)) categoriesArray = d.data;
      }
      setCategories(categoriesArray);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await devicesApi.getAll({ page, size: itemsPerPage });
      let devicesArray: DeviceResponse[] = [];
      if (result) {
        if (Array.isArray(result)) {
          devicesArray = result;
        } else if (Array.isArray(result.content)) {
          devicesArray = result.content;
          setTotalPages(result.totalPages ?? 0);
          setTotalItems(result.totalElements ?? 0);
        }
      }
      setDevices(devicesArray);
    } catch (error) {
      console.error('Failed to load devices:', error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const deviceName =
        getNameForLocale(
          device.translations as Record<string, { name?: string }> | undefined,
          device.name
        ) || '';
      const matchesSearch =
        !searchQuery ||
        device.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const categoryId = device.deviceCategoryId ?? device.category?.id;
      const matchesCategory =
        categoryFilter === 'all' || (categoryId != null && categoryId.toString() === categoryFilter);

      return matchesSearch && matchesCategory;
    });
  }, [devices, searchQuery, categoryFilter, getNameForLocale]);

  const handleCreate = () => {
    setFormData({
      code: '',
      deviceCategoryId: categories[0]?.id || 0,
      translations: {
        en: { locale: 'en', name: '', description: '' },
        ru: { locale: 'ru', name: '', description: '' },
      },
    });
    setIsModalOpen(true);
  };

  const handleDelete = (device: DeviceResponse) => {
    setDeletingDevice(device);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingDevice) return;
    try {
      await devicesApi.delete(deletingDevice.id);
      setIsDeleteModalOpen(false);
      setDeletingDevice(null);
      showToast(t('admin.messages.deleteSuccess'), 'success');
      await loadData();
    } catch (error) {
      console.error('Failed to delete device:', error);
      showToast(t('admin.messages.deleteError'), 'error');
    }
  };

  const handleSubmit = async () => {
    // Валидация
    if (!formData.code.trim()) {
      showToast(t('admin.messages.createError'), 'error');
      return;
    }
    if (!formData.deviceCategoryId) {
      showToast('Необходимо выбрать категорию устройства', 'error');
      return;
    }
    if (!formData.translations.en.name.trim() && !formData.translations.ru.name.trim()) {
      showToast('Необходимо указать название хотя бы на одном языке', 'error');
      return;
    }

    try {
      await devicesApi.create(formData);
      showToast(t('admin.messages.createSuccess'), 'success');
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save device:', error);
      showToast(
        t('admin.messages.createError'),
        'error'
      );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('admin.never');
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const columns: Column<DeviceResponse>[] = [
    {
      key: 'code',
      label: t('admin.code'),
      sortable: true,
    },
    {
      key: 'name',
      label: t('admin.name'),
      sortable: true,
      render: (device) => {
        const name =
          getNameForLocale(
            device.translations as Record<string, { name?: string }> | undefined,
            device.name
          ) || '-';
        return <span className="text-sm">{name}</span>;
      },
    },
    {
      key: 'category',
      label: t('admin.deviceCategory'),
      render: (device) => {
        const cat =
          device.category ??
          categories.find((c) => c.id === (device.deviceCategoryId ?? device.category?.id));
        const tr = cat?.translations as Record<string, { name?: string }> | undefined;
        const catName = cat
          ? getNameForLocale(tr, cat.name) || cat.code
          : null;
        const name = catName ?? device.deviceCategoryName ?? '-';
        return <span className="text-sm">{name}</span>;
      },
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">{t('admin.devices.title')}</h2>
          <Button onClick={handleCreate} type="button">
            {t('admin.create')} {t('admin.device')}
          </Button>
        </div>

        <DataTable
          data={filteredDevices}
          columns={columns}
          searchPlaceholder={t('admin.searchDevices')}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={
            <>
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('admin.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.allCategories')}</SelectItem>
                  {categories.map((cat) => {
                    const catName =
                      getNameForLocale(
                        cat.translations as Record<string, { name?: string }> | undefined,
                        cat.name
                      ) || cat.code;
                    return (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {catName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </>
          }
          actions={(device) => (
            <>
              <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/devices/${device.id}`)}
                  aria-label={t('admin.edit')}
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.edit')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => handleDelete(device)}
                  aria-label={t('admin.delete')}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.delete')}</TooltipContent>
            </Tooltip>
          </>
        )}
          pagination={
            totalPages > 1
              ? {
                  page,
                  totalPages,
                  totalItems,
                  itemsPerPage,
                  onPageChange: setPage,
                  onItemsPerPageChange: setItemsPerPage,
                }
              : undefined
          }
          loading={loading}
        />

      <DeviceFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        editingDevice={null}
        onSubmit={handleSubmit}
      />

      <DeviceDeleteModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        device={deletingDevice}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingDevice(null);
        }}
        title={t('admin.deleteConfirm')}
        confirmLabel={t('admin.delete')}
        cancelLabel={t('common.cancel')}
        message={t('admin.messages.deleteConfirm')}
        warningMessage={t('admin.messages.deleteWarning')}
      />
    </div>
  </TooltipProvider>
  );
}
