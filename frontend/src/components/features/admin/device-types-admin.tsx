'use client';

import { useState, useEffect, useMemo } from 'react';
import { deviceTypesApi } from '@/lib/api-client';
import type { DeviceTypeResponse, DeviceTypeRequest } from '@/types/api';
import type { TranslationResponse } from '@/types/api';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/app-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/** Normalize API translations to ru/en keys (API may use ru_RU, en_US or array) */
function normalizeTranslations(
  raw: Record<string, TranslationResponse> | TranslationResponse[] | undefined,
  fallbackName: string,
  fallbackDescription: string
): Record<string, TranslationResponse> {
  const tr: Record<string, TranslationResponse> = {};
  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      const loc = (item.locale || '').toLowerCase();
      if (loc.startsWith('ru')) tr.ru = { locale: 'ru', name: item.name ?? '', description: item.description ?? '' };
      else if (loc.startsWith('en')) tr.en = { locale: 'en', name: item.name ?? '', description: item.description ?? '' };
    });
  } else if (raw && typeof raw === 'object') {
    Object.assign(tr, raw);
  }
  const pick = (locale: 'ru' | 'en', keys: string[]) => {
    for (const k of keys) {
      const v = tr[k];
      if (v && (v.name !== undefined || v.description !== undefined))
        return { locale, name: v.name ?? '', description: v.description ?? '' };
    }
    return { locale, name: '', description: '' };
  };
  const ru = pick('ru', ['ru', 'ru_RU', 'RU', 'ru-RU']);
  const en = pick('en', ['en', 'en_US', 'en_GB', 'EN', 'en-US', 'en-US']);
  return {
    ru,
    en: en.name ? en : { locale: 'en', name: fallbackName, description: fallbackDescription },
  };
}

export function DeviceTypesAdmin() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<DeviceTypeResponse | null>(null);
  const [editingType, setEditingType] = useState<DeviceTypeResponse | null>(null);
  const [formData, setFormData] = useState<DeviceTypeRequest>({
    code: '',
    active: true,
    translations: {
      en: { locale: 'en', name: '', description: '' },
      ru: { locale: 'ru', name: '', description: '' },
    },
  });

  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { paginatedData, totalPages, totalItems } = useMemo(() => {
    const total = deviceTypes.length;
    const totalPgs = Math.max(1, Math.ceil(total / itemsPerPage));
    const from = page * itemsPerPage;
    const to = from + itemsPerPage;
    return {
      paginatedData: deviceTypes.slice(from, to),
      totalPages: totalPgs,
      totalItems: total,
    };
  }, [deviceTypes, page, itemsPerPage]);

  useEffect(() => {
    loadDeviceTypes();
  }, []);

  const loadDeviceTypes = async () => {
    try {
      setLoading(true);
      const data = await deviceTypesApi.getAll();
      // Handle both direct arrays and objects with content/data
      let typesArray: DeviceTypeResponse[] = [];
      if (data) {
        if (Array.isArray(data)) {
          typesArray = data;
        } else if (Array.isArray((data as { content?: unknown[] }).content)) {
          typesArray = (data as { content: DeviceTypeResponse[] }).content;
        } else if (Array.isArray((data as { data?: unknown[] }).data)) {
          typesArray = (data as { data: DeviceTypeResponse[] }).data;
        }
      }
      const normalized = typesArray.map((item) => ({
        ...item,
        translations: normalizeTranslations(
          item.translations as Record<string, TranslationResponse> | TranslationResponse[] | undefined,
          item.name || '',
          item.description || ''
        ),
      }));
      setDeviceTypes(normalized);
    } catch (error) {
      console.error('Failed to load device types:', error);
      setError(error instanceof Error ? error.message : 'Failed to load device types');
      setDeviceTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType(null);
    setFormData({
      code: '',
      active: true,
      translations: {
        en: { locale: 'en', name: '', description: '' },
        ru: { locale: 'ru', name: '', description: '' },
      },
    });
    setIsModalOpen(true);
  };

  const handleEdit = (type: DeviceTypeResponse) => {
    setEditingType(type);
    const translations = normalizeTranslations(
      type.translations as Record<string, TranslationResponse> | TranslationResponse[] | undefined,
      type.name || '',
      type.description || ''
    );
    setFormData({
      code: type.code,
      active: type.active,
      translations,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (type: DeviceTypeResponse) => {
    setDeletingType(type);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingType) return;
    try {
      await deviceTypesApi.delete(deletingType.id);
      setIsDeleteModalOpen(false);
      setDeletingType(null);
      showToast(t('admin.messages.deleteSuccess'), 'success');
      await loadDeviceTypes();
    } catch (error) {
      console.error('Failed to delete device type:', error);
      showToast(t('admin.messages.deleteError'), 'error');
    }
  };

  const handleSubmit = async () => {
    // Валидация
    if (!formData.code.trim()) {
      showToast(t('admin.messages.createError'), 'error');
      return;
    }
    if (!formData.translations.en.name.trim() && !formData.translations.ru.name.trim()) {
      showToast('Необходимо указать название хотя бы на одном языке', 'error');
      return;
    }

    try {
      if (editingType) {
        await deviceTypesApi.update(editingType.id, formData);
        showToast(t('admin.messages.updateSuccess'), 'success');
      } else {
        await deviceTypesApi.create(formData);
        showToast(t('admin.messages.createSuccess'), 'success');
      }
      setIsModalOpen(false);
      await loadDeviceTypes();
    } catch (error) {
      console.error('Failed to save device type:', error);
      showToast(
        editingType ? t('admin.messages.updateError') : t('admin.messages.createError'),
        'error'
      );
    }
  };

  const columns: Column<DeviceTypeResponse>[] = useMemo(
    () => [
      { key: 'code', label: t('admin.code') },
      {
        key: 'name',
        label: t('admin.name'),
        render: (row) => {
          const tr = row.translations as Record<string, TranslationResponse> | undefined;
          const name = tr?.ru?.name || tr?.en?.name || row.name;
          return name || '—';
        },
      },
      {
        key: 'description',
        label: t('admin.description'),
        render: (row) => {
          const tr = row.translations as Record<string, TranslationResponse> | undefined;
          const desc = tr?.ru?.description || tr?.en?.description || row.description;
          return (
            <span className="max-w-[200px] truncate block text-muted-foreground" title={desc || ''}>
              {desc || '—'}
            </span>
          );
        },
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{t('admin.deviceTypes.title')}</h2>
        <AppButton onClick={handleCreate}>
          {t('admin.create')}
        </AppButton>
      </div>

      <DataTable<DeviceTypeResponse>
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
        actions={(type) => (
          <>
            <AppButton size="sm" variant="secondary" onClick={() => handleEdit(type)}>
              {t('admin.edit')}
            </AppButton>
            <AppButton size="sm" variant="destructive" onClick={() => handleDelete(type)}>
              {t('admin.delete')}
            </AppButton>
          </>
        )}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingType ? t('admin.editDeviceType') : t('admin.createDeviceType')}
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
                      placeholder={t('admin.placeholders.code')}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.helpers.codeDeviceType')}
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
                            placeholder={t('admin.placeholders.nameRu')}
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
                            placeholder={t('admin.placeholders.descriptionRu')}
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
                            placeholder={t('admin.placeholders.nameEn')}
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
                            placeholder={t('admin.placeholders.descriptionEn')}
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
            <AppButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </AppButton>
            <AppButton onClick={handleSubmit}>{t('common.save')}</AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.deleteConfirm')}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {t('admin.messages.deleteConfirm')} "{deletingType?.name}"?
          </DialogDescription>
          <p className="text-xs text-warning dark:text-warning/85">
            {t('admin.messages.deleteWarning')}
          </p>
          {deletingType?.deviceCategories && deletingType.deviceCategories.length > 0 && (
            <p className="text-xs text-danger dark:text-danger/85">
              {t('admin.deleteWarningCategories')}
            </p>
          )}
          <DialogFooter>
            <AppButton variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              {t('common.cancel')}
            </AppButton>
            <AppButton variant="destructive" onClick={confirmDelete}>
              {t('admin.delete')}
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
