'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { deviceFunctionsApi, devicesApi } from '@/lib/api-client';
import type { DeviceFunctionResponse, DeviceFunctionRequest, DeviceResponse } from '@/types/api';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/animate-ui/components/animate/tooltip';

interface DeviceFunctionsAdminProps {
  deviceId?: number | null;
  showBackButton?: boolean;
}

export function DeviceFunctionsAdmin({
  deviceId: propDeviceId,
  showBackButton = true,
}: DeviceFunctionsAdminProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [functions, setFunctions] = useState<DeviceFunctionResponse[]>([]);
  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(propDeviceId || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingFunction, setDeletingFunction] = useState<DeviceFunctionResponse | null>(null);
  const [isDeviceSelectModalOpen, setIsDeviceSelectModalOpen] = useState(false);
  const [editingFunction, setEditingFunction] = useState<DeviceFunctionResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<DeviceFunctionRequest>({
    code: '',
    deviceId: 0,
    functionType: 'READ',
    minValue: undefined,
    maxValue: undefined,
    unit: '',
    translations: {
      en: { locale: 'en', name: '', description: '' },
      ru: { locale: 'ru', name: '', description: '' },
    },
  });


  const loadDevices = async () => {
    try {
      const devicesData = await devicesApi.getAll({ page: 0, size: 100 });
      setDevices(Array.isArray(devicesData?.content) ? devicesData.content : []);
    } catch (error) {
      console.error('Failed to load devices:', error);
      setDevices([]);
    }
  };

  const loadFunctions = async (deviceId?: number) => {
    try {
      setLoading(true);
      setError(null);
      if (!deviceId) {
        setFunctions([]);
        return;
      }
      const functionsData = await deviceFunctionsApi.getByDeviceId(deviceId);
      const functionsArray = Array.isArray(functionsData) ? functionsData : [];
      setFunctions(functionsArray);
    } catch (error) {
      console.error('Failed to load functions:', error);
      setError('Failed to load functions');
      setFunctions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propDeviceId) {
      setSelectedDeviceId(propDeviceId);
      loadFunctions(propDeviceId);
    } else {
      loadDevices();
      loadFunctions();
    }
  }, [propDeviceId]);

  useEffect(() => {
    if (!propDeviceId && selectedDeviceId) {
      loadFunctions(selectedDeviceId);
    } else if (!propDeviceId && !selectedDeviceId) {
      loadFunctions();
    }
  }, [selectedDeviceId, propDeviceId]);

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

  const handleCreate = () => {
    setEditingFunction(null);
    setFormData({
      code: '',
      deviceId: selectedDeviceId || devices[0]?.id || 0,
      functionType: 'READ',
      minValue: undefined,
      maxValue: undefined,
      unit: '',
      active: true,
      translations: {
        en: { locale: 'en', name: '', description: '' },
        ru: { locale: 'ru', name: '', description: '' },
      },
    });
    setIsModalOpen(true);
  };

  const handleEdit = (func: DeviceFunctionResponse) => {
    setEditingFunction(func);
    setFormData({
      code: func.code,
      deviceId: func.deviceId ?? 0,
      functionType: func.functionType,
      currentValue: func.currentValue || '',
      minValue: func.minValue,
      maxValue: func.maxValue,
      unit: func.unit || '',
      translations: func.translations || {
        en: { locale: 'en', name: func.name || '', description: func.description || '' },
        ru: { locale: 'ru', name: func.name || '', description: func.description || '' },
      },
    });
    setIsModalOpen(true);
  };

  const handleDelete = (func: DeviceFunctionResponse) => {
    setDeletingFunction(func);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingFunction) return;
    try {
      await deviceFunctionsApi.delete(deletingFunction.id);
      setIsDeleteModalOpen(false);
      setDeletingFunction(null);
      showToast(t('admin.messages.deleteSuccess'), 'success');
      await loadFunctions(selectedDeviceId || undefined);
    } catch (error) {
      console.error('Failed to delete function:', error);
      showToast(t('admin.messages.deleteError'), 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formData.code.trim()) {
      showToast(t('admin.messages.createError'), 'error');
      return;
    }
    if (!formData.deviceId) {
      showToast(t('admin.messages.requiredDevice'), 'error');
      return;
    }
    if (!formData.translations.en.name.trim() && !formData.translations.ru.name.trim()) {
      showToast(t('admin.messages.requiredName'), 'error');
      return;
    }

    try {
      if (editingFunction) {
        await deviceFunctionsApi.update(editingFunction.id, formData);
        showToast(t('admin.messages.updateSuccess'), 'success');
      } else {
        await deviceFunctionsApi.create(formData);
        showToast(t('admin.messages.createSuccess'), 'success');
      }
      setIsModalOpen(false);
      await loadFunctions(selectedDeviceId || undefined);
    } catch (error) {
      console.error('Failed to save function:', error);
      showToast(
        editingFunction ? t('admin.messages.updateError') : t('admin.messages.createError'),
        'error'
      );
    }
  };

  const deviceIdForLinks = propDeviceId ?? selectedDeviceId;

  const filteredFunctions = useMemo(() => {
    if (!searchQuery.trim()) return functions;
    const q = searchQuery.toLowerCase();
    return functions.filter((f) => {
      const name = getNameForLocale(f.translations as Record<string, { name?: string }> | undefined, f.name);
      return (
        f.code.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        (f.functionType || '').toLowerCase().includes(q)
      );
    });
  }, [functions, searchQuery, getNameForLocale]);

  const columns: Column<DeviceFunctionResponse>[] = useMemo(
    () => [
      { key: 'code', label: t('admin.code') },
      {
        key: 'name',
        label: t('admin.name'),
        render: (row) => (
          <span className="text-sm">
            {getNameForLocale(row.translations as Record<string, { name?: string }> | undefined, row.name) || '—'}
          </span>
        ),
      },
      {
        key: 'functionType',
        label: t('admin.functionType'),
        render: (row) => (
          <Badge variant="secondary">
            {row.functionType}
          </Badge>
        ),
      },
    ],
    [t, getNameForLocale]
  );

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-danger bg-danger/10 p-4 text-danger">
          <p className="font-semibold">{t('common.error')}</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={() => loadFunctions(selectedDeviceId || undefined)} variant="secondary">
          {t('admin.retry')}
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {propDeviceId && showBackButton && (
        <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin/devices')} type="button">
              ← {t('admin.backToDevices')}
            </Button>
          </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{t('admin.deviceFunctions.title')}</h2>
        <div className="flex gap-2">
          {!propDeviceId && (
            <Button
              onClick={() => setIsDeviceSelectModalOpen(true)}
              variant="secondary"
              type="button"
            >
              {selectedDeviceId ? t('admin.changeDevice') : t('admin.selectDevice')}
            </Button>
          )}
          <Button onClick={handleCreate} type="button">
            {t('admin.create')}
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredFunctions}
        columns={columns}
        searchPlaceholder={t('admin.search')}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        loading={false}
        actions={(func) => (
          <>
            {deviceIdForLinks != null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/devices/${deviceIdForLinks}/functions/${func.id}/actions`)}
                    aria-label={t('admin.viewActions')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('admin.viewActions')}</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleEdit(func)}
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
                  onClick={() => handleDelete(func)}
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
      />

      <Dialog open={isDeviceSelectModalOpen} onOpenChange={setIsDeviceSelectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.selectDevice')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedDeviceId(null);
                setIsDeviceSelectModalOpen(false);
                loadFunctions();
              }}
              className="w-full"
              type="button"
            >
              {t('admin.allDevices')}
            </Button>
            {devices.map((device) => {
              const displayName = getNameForLocale(device.translations as Record<string, { name?: string }> | undefined, device.name) || device.code;
              return (
                <Button
                  key={device.id}
                  variant={selectedDeviceId === device.id ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedDeviceId(device.id);
                    setIsDeviceSelectModalOpen(false);
                    loadFunctions(device.id);
                  }}
                  className="w-full justify-start"
                  type="button"
                >
                  {displayName}
                </Button>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDeviceSelectModalOpen(false)}
              type="button"
            >
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingFunction ? t('admin.editDeviceFunction') : t('admin.createDeviceFunction')}
            </DialogTitle>
          </DialogHeader>
          <div className="admin-modal-body overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-6">
              <div className="admin-form-section">
                <h3 className="admin-form-section-title">{t('admin.basicInfo')}</h3>
                <div className="admin-form-grid">
                  <div className="admin-form-full-width space-y-2">
                    <label className="text-sm font-medium">{t('admin.code')}</label>
                    <Input
                      placeholder={t('admin.placeholders.codeFunction')}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.helpers.codeFunction')}
                    </p>
                  </div>
                  <div className="admin-form-full-width space-y-2">
                    <label className="text-sm font-medium">{t('admin.device')}</label>
                    <Select
                      value={formData.deviceId ? formData.deviceId.toString() : ''}
                      onValueChange={(value) => {
                        if (value) {
                          setFormData({ ...formData, deviceId: parseInt(value) });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('admin.placeholders.selectDevice')} />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map((device) => {
                          const displayName = getNameForLocale(device.translations as Record<string, { name?: string }> | undefined, device.name) || device.code;
                          return (
                            <SelectItem key={device.id} value={device.id.toString()}>
                              {displayName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="admin-form-full-width space-y-2">
                    <label className="text-sm font-medium">{t('admin.functionType')}</label>
                    <Select
                      value={formData.functionType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, functionType: value as 'READ' | 'WRITE' | 'READ_WRITE' })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('admin.placeholders.selectFunctionType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="READ">{t('admin.functionTypeRead')} (READ)</SelectItem>
                        <SelectItem value="WRITE">{t('admin.functionTypeWrite')} (WRITE)</SelectItem>
                        <SelectItem value="READ_WRITE">{t('admin.functionTypeReadWrite')} (READ_WRITE)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.helpers.functionType')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="admin-form-section">
                <h3 className="admin-form-section-title">{t('admin.valueSettings')}</h3>
                <div className="admin-form-grid">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.currentValue')}</label>
                    <Input
                      placeholder={t('admin.placeholders.currentValue')}
                      value={formData.currentValue || ''}
                      onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.helpers.currentValue')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.unit')}</label>
                    <Input
                      placeholder={t('admin.placeholders.unit')}
                      value={formData.unit || ''}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">{t('admin.helpers.unit')}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.minValue')}</label>
                    <Input
                      type="number"
                      placeholder={t('admin.placeholders.minValue')}
                      value={formData.minValue?.toString() || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minValue: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">{t('admin.helpers.minValue')}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin.maxValue')}</label>
                    <Input
                      type="number"
                      placeholder={t('admin.placeholders.maxValue')}
                      value={formData.maxValue?.toString() || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxValue: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">{t('admin.helpers.maxValue')}</p>
                  </div>
                </div>
              </div>

              <div className="admin-form-section">
                <h3 className="admin-form-section-title mb-3">
                  {t('admin.translations')} *
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-20">
                          {t('admin.locale')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                          {t('admin.name')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                          {t('admin.description')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium align-top pt-4">RU</td>
                        <td className="px-4 py-3 space-y-1">
                          <Input
                            placeholder={t('admin.placeholders.nameFunctionRu')}
                            value={formData.translations.ru.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                translations: {
                                  ...formData.translations,
                                  ru: { ...formData.translations.ru, name: e.target.value },
                                },
                              })
                            }
                            required
                          />
                          <p className="text-xs text-muted-foreground">{t('admin.helpers.name')}</p>
                        </td>
                        <td className="px-4 py-3 space-y-1">
                          <Input
                            placeholder={t('admin.placeholders.descriptionFunctionRu')}
                            value={formData.translations.ru.description || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                translations: {
                                  ...formData.translations,
                                  ru: { ...formData.translations.ru, description: e.target.value },
                                },
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">{t('admin.helpers.description')}</p>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium align-top pt-4">EN</td>
                        <td className="px-4 py-3 space-y-1">
                          <Input
                            placeholder={t('admin.placeholders.nameFunctionEn')}
                            value={formData.translations.en.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                translations: {
                                  ...formData.translations,
                                  en: { ...formData.translations.en, name: e.target.value },
                                },
                              })
                            }
                            required
                          />
                          <p className="text-xs text-muted-foreground">{t('admin.helpers.name')}</p>
                        </td>
                        <td className="px-4 py-3 space-y-1">
                          <Input
                            placeholder={t('admin.placeholders.descriptionFunctionEn')}
                            value={formData.translations.en.description || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                translations: {
                                  ...formData.translations,
                                  en: { ...formData.translations.en, description: e.target.value },
                                },
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">{t('admin.helpers.description')}</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.deleteConfirm')}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {t('admin.messages.deleteConfirm')} "{deletingFunction ? getNameForLocale(deletingFunction.translations as Record<string, { name?: string }> | undefined, deletingFunction.name) || deletingFunction.code : ''}"?
          </DialogDescription>
          <p className="text-xs text-warning dark:text-warning/85">
            {t('admin.messages.deleteWarning')}
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('admin.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
