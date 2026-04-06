'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setPage(0);
  }, [searchQuery, categoryFilter]);

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
    if (!formData.code.trim()) {
      showToast(t('admin.messages.createError'), 'error');
      return;
    }
    if (!formData.deviceCategoryId) {
      showToast(t('admin.messages.requiredCategory'), 'error');
      return;
    }
    if (!formData.translations.en.name.trim() && !formData.translations.ru.name.trim()) {
      showToast(t('admin.messages.requiredName'), 'error');
      return;
    }

    try {
      await devicesApi.create(formData);
      showToast(t('admin.messages.createSuccess'), 'success');
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save device:', error);
      showToast(t('admin.messages.createError'), 'error');
    }
  };

  const columns: Column<DeviceResponse>[] = [
    {
      key: 'name',
      label: t('admin.name'),
      sortable: true,
      render: (device) => {
        const name =
          getNameForLocale(
            device.translations as Record<string, { name?: string }> | undefined,
            device.name
          ) || device.code;
        return (
          <div>
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-muted-foreground font-mono">{device.code}</p>
          </div>
        );
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
        const name = catName ?? device.deviceCategoryName ?? '—';
        return (
          <Badge variant="outline" className="text-xs font-normal">
            {name}
          </Badge>
        );
      },
    },
    {
      key: 'active',
      label: t('admin.statusLabel'),
      render: (device) => (
        <Badge
          variant="outline"
          className={
            device.active
              ? 'border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-300'
              : 'border-border bg-muted text-muted-foreground'
          }
        >
          {device.active ? t('admin.active') : t('admin.inactive')}
        </Badge>
      ),
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t('admin.devices.title')}</h2>
          <Button onClick={handleCreate} type="button">
            {t('admin.createDevice')}
          </Button>
        </div>

        <DataTable
          data={filteredDevices}
          columns={columns}
          searchPlaceholder={t('admin.searchDevices')}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onRowClick={(device) => router.push(`/admin/devices/${device.id}`)}
          filters={
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
          }
          actions={(device) => (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => handleDelete(device)}
                  aria-label={t('admin.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.delete')}</TooltipContent>
            </Tooltip>
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
