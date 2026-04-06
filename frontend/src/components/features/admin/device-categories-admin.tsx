'use client';

import { useState, useEffect, useMemo } from 'react';
import { deviceCategoriesApi, deviceTypesApi } from '@/lib/api-client';
import type { DeviceCategoryResponse, DeviceCategoryRequest, DeviceTypeResponse } from '@/types/api';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { DataTable, type Column } from '@/components/shared/DataTable';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


export function DeviceCategoriesAdmin() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<DeviceCategoryResponse[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<DeviceCategoryResponse | null>(null);
  const [editingCategory, setEditingCategory] = useState<DeviceCategoryResponse | null>(null);
  const [formData, setFormData] = useState<DeviceCategoryRequest>({
    code: '',
    deviceTypeId: 0,
    active: true,
    translations: {
      en: { locale: 'en', name: '', description: '' },
      ru: { locale: 'ru', name: '', description: '' },
    },
  });

  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { paginatedData, totalPages, totalItems } = useMemo(() => {
    const total = categories.length;
    const totalPgs = Math.max(1, Math.ceil(total / itemsPerPage));
    const from = page * itemsPerPage;
    const to = from + itemsPerPage;
    return {
      paginatedData: categories.slice(from, to),
      totalPages: totalPgs,
      totalItems: total,
    };
  }, [categories, page, itemsPerPage]);

  const extractArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) {
      return data as T[];
    }
    if (data && typeof data === 'object') {
      const typed = data as { content?: unknown; data?: unknown };
      if (Array.isArray(typed.content)) {
        return typed.content as T[];
      }
      if (Array.isArray(typed.data)) {
        return typed.data as T[];
      }
    }
    return [];
  };

  const columns: Column<DeviceCategoryResponse>[] = useMemo(
    () => [
      { key: 'code', label: t('admin.code') },
      { key: 'name', label: t('admin.name') },
      {
        key: 'description',
        label: t('admin.description'),
        render: (row) => (
          <span className="max-w-[200px] truncate block text-muted-foreground" title={row.description || ''}>
            {row.description || '—'}
          </span>
        ),
      },
      {
        key: 'deviceTypeId',
        label: t('admin.deviceType'),
        render: (row) => deviceTypes.find((type) => type.id === row.deviceTypeId)?.name ?? '—',
      },
      {
        key: 'active',
        label: t('admin.statusLabel'),
        render: (row) => (
          <Badge
            variant="outline"
            className={
              row.active
                ? 'border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-300'
                : 'border-border bg-muted text-muted-foreground dark:border-border/60 dark:bg-muted/50 dark:text-muted-foreground/90'
            }
          >
            {row.active ? t('admin.active') : t('admin.inactive')}
          </Badge>
        ),
      },
    ],
    [t, deviceTypes]
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await Promise.allSettled([
        deviceCategoriesApi.getAll(),
        deviceTypesApi.getAll(),
      ]);

      const [categoriesResult, typesResult] = results;

      // Handle categories
      if (categoriesResult.status === 'fulfilled') {
        const categoriesData = categoriesResult.value as unknown;
        setCategories(extractArray<DeviceCategoryResponse>(categoriesData));
      } else {
        console.error('Failed to load categories:', categoriesResult.reason);
        // If main data fails, we should set error
        const reason = categoriesResult.reason;
        setError(reason instanceof Error ? reason.message : 'Failed to load categories');
        setCategories([]);
      }
      
      // Handle device types
      if (typesResult.status === 'fulfilled') {
        const typesData = typesResult.value as unknown;
        setDeviceTypes(extractArray<DeviceTypeResponse>(typesData));
      } else {
        console.error('Failed to load device types:', typesResult.reason);
        setDeviceTypes([]);
      }
    } catch (error) {
      console.error('Unexpected error in loadData:', error);
      setError(error instanceof Error ? error.message : 'Unexpected error');
      setCategories([]);
      setDeviceTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      code: '',
      deviceTypeId: deviceTypes[0]?.id || 0,
      active: true,
      translations: {
        en: { locale: 'en', name: '', description: '' },
        ru: { locale: 'ru', name: '', description: '' },
      },
    });
    setIsModalOpen(true);
  };

  const handleEdit = (category: DeviceCategoryResponse) => {
    setEditingCategory(category);
    setFormData({
      code: category.code,
      deviceTypeId: category.deviceTypeId ?? 0,
      active: category.active,
      translations: category.translations || {
        en: { locale: 'en', name: category.name || '', description: category.description || '' },
        ru: { locale: 'ru', name: category.name || '', description: category.description || '' },
      },
    });
    setIsModalOpen(true);
  };

  const handleDelete = (category: DeviceCategoryResponse) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deviceCategoriesApi.delete(deletingCategory.id);
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
      showToast(t('admin.messages.deleteSuccess'), 'success');
      await loadData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      showToast(t('admin.messages.deleteError'), 'error');
    }
  };

  const handleSubmit = async () => {
    // Валидация
    if (!formData.code.trim()) {
      showToast(t('admin.messages.createError'), 'error');
      return;
    }
    if (!formData.deviceTypeId) {
      showToast(t('admin.messages.requiredDeviceType'), 'error');
      return;
    }
    if (!formData.translations.en.name.trim() && !formData.translations.ru.name.trim()) {
      showToast(t('admin.messages.requiredName'), 'error');
      return;
    }

    try {
      if (editingCategory) {
        await deviceCategoriesApi.update(editingCategory.id, formData);
        showToast(t('admin.messages.updateSuccess'), 'success');
      } else {
        await deviceCategoriesApi.create(formData);
        showToast(t('admin.messages.createSuccess'), 'success');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save category:', error);
      showToast(
        editingCategory ? t('admin.messages.updateError') : t('admin.messages.createError'),
        'error'
      );
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-danger bg-danger/10 p-4 text-danger dark:border-danger/40 dark:bg-danger/15 dark:text-danger/85">
          <p className="font-semibold">{t('common.error')}</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button variant="secondary" onClick={loadData}>
          {t('admin.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{t('admin.deviceCategories.title')}</h2>
        <Button onClick={handleCreate} type="button">
          {t('admin.create')}
        </Button>
      </div>

      <DataTable<DeviceCategoryResponse>
        data={paginatedData}
        columns={columns}
        loading={loading}
        pagination={{
          page,
          totalPages,
          totalItems,
          itemsPerPage,
          onPageChange: setPage,
          onItemsPerPageChange: (size) => {
            setItemsPerPage(size);
            setPage(0);
          },
        }}
        actions={(category) => (
          <>
            <Button size="sm" variant="secondary" onClick={() => handleEdit(category)} type="button">
              {t('admin.edit')}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(category)} type="button">
              {t('admin.delete')}
            </Button>
          </>
        )}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('admin.editDeviceCategory') : t('admin.createDeviceCategory')}
            </DialogTitle>
          </DialogHeader>
          <div className="admin-modal-body max-h-[calc(90vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              <div className="admin-form-section">
                <h3 className="admin-form-section-title">{t('admin.basicInfo')}</h3>
                <div className="admin-form-grid">
                  <div className="admin-form-full-width space-y-2">
                    <label className="text-sm font-medium">{t('admin.code')}</label>
                    <Input
                      placeholder={t('admin.placeholders.codeCategory')}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.helpers.codeDeviceCategory')}
                    </p>
                  </div>
                  <div className="admin-form-full-width space-y-2">
                    <label className="text-sm font-medium">{t('admin.deviceType')}</label>
                    <Select
                      value={formData.deviceTypeId ? formData.deviceTypeId.toString() : ''}
                      onValueChange={(value) =>
                        setFormData({ ...formData, deviceTypeId: value ? parseInt(value) : 0 })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('admin.placeholders.selectDeviceType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.helpers.deviceTypeSelect')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="admin-form-section">
                <h3 className="admin-form-section-title mb-3">
                  {t('admin.translations')} *
                </h3>
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">{t('admin.locale')}</TableHead>
                        <TableHead>{t('admin.name')}</TableHead>
                        <TableHead>{t('admin.description')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium align-top pt-4">RU</TableCell>
                        <TableCell className="space-y-1">
                          <Input
                            placeholder={t('admin.placeholders.nameCategoryRu')}
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
                        </TableCell>
                        <TableCell className="space-y-1">
                          <Input
                            placeholder={t('admin.placeholders.descriptionCategoryRu')}
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
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium align-top pt-4">EN</TableCell>
                        <TableCell className="space-y-1">
                          <Input
                            placeholder={t('admin.placeholders.nameCategoryEn')}
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
                        </TableCell>
                        <TableCell className="space-y-1">
                          <Input
                            placeholder={t('admin.placeholders.descriptionCategoryEn')}
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
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="admin-form-section space-y-2">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(value) => setFormData({ ...formData, active: value })}
                  />
                  <span className="text-sm">{t('admin.status.active')}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.statusDescription')}
                </p>
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
            {t('admin.messages.deleteConfirm')} &quot;{deletingCategory?.name}&quot;?
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
  );
}
