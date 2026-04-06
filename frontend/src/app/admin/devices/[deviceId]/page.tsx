'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/shared';
import { devicesApi, deviceCategoriesApi } from '@/lib/api-client';
import type { DeviceCategoryResponse, DeviceRequest, DeviceResponse } from '@/types/api';
import { useTranslation } from '@/hooks';
import { Button } from '@/components/ui/button';
import { DeviceFormModal } from '@/components/features/admin/devices';
import { DeviceFunctionsAdmin } from '@/components/features/admin/device-functions-admin';
import { DeviceFunctionActionsAdmin } from '@/components/features/admin/device-function-actions-admin';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
} from '@/components/animate-ui/components/radix/tabs';

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const [device, setDevice] = useState<DeviceResponse | null>(null);
  const [categories, setCategories] = useState<DeviceCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<DeviceRequest>({
    code: '',
    deviceCategoryId: 0,
    translations: {
      en: { locale: 'en', name: '', description: '' },
      ru: { locale: 'ru', name: '', description: '' },
    },
  });

  const deviceId = useMemo(() => {
    const raw = params?.deviceId;
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }, [params?.deviceId]);

  const getNameForLocale = useCallback(
    (translations: Record<string, { name?: string }> | undefined, fallbackName?: string): string => {
      if (!translations) return fallbackName ?? '';
      const exact = translations[locale]?.name;
      if (exact) return exact;
      const lower = locale.toLowerCase();
      const key = Object.keys(translations).find(
        (k) => k.toLowerCase() === lower || k.toLowerCase().startsWith(lower + '_')
      );
      if (key && translations[key]?.name) return translations[key].name ?? '';
      return translations.ru?.name ?? translations.en?.name ?? fallbackName ?? '';
    },
    [locale]
  );

  const buildFormData = useCallback((data: DeviceResponse): DeviceRequest => {
    const categoryId = data.deviceCategoryId ?? data.category?.id ?? 0;
    return {
      code: data.code,
      deviceCategoryId: categoryId,
      status: data.status,
      serialNumber: data.serialNumber || '',
      firmwareVersion: data.firmwareVersion || '',
      active: data.active,
      translations: data.translations || {
        en: { locale: 'en', name: data.name || '', description: data.description || '' },
        ru: { locale: 'ru', name: data.name || '', description: data.description || '' },
      },
    };
  }, []);

  const loadCategories = useCallback(async () => {
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
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  }, []);

  const loadDevice = useCallback(async () => {
    if (!deviceId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await devicesApi.getById(deviceId);
      setDevice(data);
      setFormData(buildFormData(data));
    } catch (err) {
      console.error('Failed to load device:', err);
      setDevice(null);
      setError(t('admin.messages.deviceLoadError'));
    } finally {
      setLoading(false);
    }
  }, [buildFormData, deviceId]);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      setError(t('admin.messages.invalidDeviceId'));
      return;
    }
    loadCategories();
    loadDevice();
  }, [deviceId, loadCategories, loadDevice]);

  const handleOpenEdit = useCallback(() => {
    if (!device) return;
    setFormData(buildFormData(device));
    setIsModalOpen(true);
  }, [buildFormData, device]);

  const handleSubmit = useCallback(async () => {
    if (!deviceId) return;
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
      await devicesApi.update(deviceId, formData);
      showToast(t('admin.messages.updateSuccess'), 'success');
      setIsModalOpen(false);
      await loadDevice();
    } catch (err) {
      console.error('Failed to update device:', err);
      showToast(t('admin.messages.updateError'), 'error');
    }
  }, [deviceId, formData, loadDevice, showToast, t]);

  const deviceName = device
    ? getNameForLocale(device.translations as Record<string, { name?: string }> | undefined, device.name) ||
      device.code
    : '';

  const categoryName = useMemo(() => {
    if (!device) return '';
    const cat =
      device.category ?? categories.find((c) => c.id === (device.deviceCategoryId ?? device.category?.id));
    const tr = cat?.translations as Record<string, { name?: string }> | undefined;
    return cat ? getNameForLocale(tr, cat.name) || cat.code : device.deviceCategoryName ?? '—';
  }, [categories, device, getNameForLocale]);

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/devices')} type="button">
            ← {t('admin.backToDevices')}
          </Button>
        </div>

        {loading && (
          <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
        )}

        {!loading && error && (
          <div className="space-y-6">
            <div className="rounded-lg border border-danger bg-danger/10 p-4 text-danger">
              <p className="font-semibold">{t('common.error')}</p>
              <p className="text-sm">{error}</p>
            </div>
            {deviceId && (
              <Button onClick={loadDevice} variant="secondary" type="button">
                {t('admin.retry')}
              </Button>
            )}
          </div>
        )}

        {!loading && !error && device && (
          <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{deviceName}</h2>
                <p className="text-sm text-muted-foreground">{device.code}</p>
              </div>
              <Button onClick={handleOpenEdit} type="button">
                {t('admin.edit')}
              </Button>
            </div>
            {device.description && (
              <p className="mt-3 text-sm text-muted-foreground">{device.description}</p>
            )}
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="font-medium">{t('admin.deviceCategory')}:</span> {categoryName || '—'}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && device && (
          <Tabs defaultValue="functions" className="w-full">
            <TabsList>
              <TabsTrigger value="functions">{t('admin.deviceFunctions.title')}</TabsTrigger>
              <TabsTrigger value="actions">{t('admin.deviceFunctionActions.title')}</TabsTrigger>
            </TabsList>
            <TabsContents>
              <TabsContent value="functions">
                <DeviceFunctionsAdmin deviceId={device.id} showBackButton={false} />
              </TabsContent>
              <TabsContent value="actions">
                <DeviceFunctionActionsAdmin deviceId={device.id} showBackButton={false} />
              </TabsContent>
            </TabsContents>
          </Tabs>
        )}
      </div>

      <DeviceFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        editingDevice={device}
        onSubmit={handleSubmit}
      />
    </>
  );
}
