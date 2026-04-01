'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { deviceFunctionActionsApi, deviceFunctionsApi, devicesApi } from '@/lib/api-client';
import type {
  DeviceFunctionActionResponse,
  DeviceFunctionActionRequest,
  DeviceFunctionResponse,
  DeviceResponse,
} from '@/types/api';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/animate-ui/components/animate/tooltip';
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
import { Textarea } from '@/components/ui/textarea';

interface DeviceFunctionActionsAdminProps {
  deviceId?: number | null;
  functionId?: number | null;
  showBackButton?: boolean;
}

export function DeviceFunctionActionsAdmin({
  deviceId,
  functionId,
  showBackButton = true,
}: DeviceFunctionActionsAdminProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [actions, setActions] = useState<DeviceFunctionActionResponse[]>([]);
  const [deviceFunctions, setDeviceFunctions] = useState<DeviceFunctionResponse[]>([]);
  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [isDeviceSelectModalOpen, setIsDeviceSelectModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAction, setDeletingAction] = useState<DeviceFunctionActionResponse | null>(null);
  const [editingAction, setEditingAction] = useState<DeviceFunctionActionResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<DeviceFunctionActionRequest>({
    code: '',
    deviceFunctionId: 0,
    actionType: 'TURN_ON',
    payloadTemplate: '',
    active: true,
    translations: {
      en: { locale: 'en', name: '', description: '' },
      ru: { locale: 'ru', name: '', description: '' },
    },
  });

  const effectiveDeviceId = deviceId ?? selectedDeviceId;

  const loadDevices = async () => {
    try {
      const devicesData = await devicesApi.getAll({ page: 0, size: 500 });
      setDevices(Array.isArray(devicesData?.content) ? devicesData.content : []);
    } catch (err) {
      console.error('Failed to load devices:', err);
      setDevices([]);
    }
  };

  useEffect(() => {
    if (!deviceId) {
      loadDevices();
    }
  }, [deviceId]);

  useEffect(() => {
    loadData();
  }, [effectiveDeviceId, functionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      let actionsData: DeviceFunctionActionResponse[] = [];
      let functionsData: DeviceFunctionResponse[] = [];

      if (functionId != null) {
        const actionsArray = await deviceFunctionActionsApi.getByDeviceFunctionId(functionId).then((a) => (Array.isArray(a) ? a : []));
        setActions(actionsArray);
        if (effectiveDeviceId != null) {
          const functionsArray = await deviceFunctionsApi.getByDeviceId(effectiveDeviceId).then((f) => (Array.isArray(f) ? f : []));
          setDeviceFunctions(functionsArray);
        } else {
          setDeviceFunctions([]);
        }
      } else if (effectiveDeviceId) {
        const [funcsRes, actionsRes] = await Promise.all([
          deviceFunctionsApi.getByDeviceId(effectiveDeviceId),
          deviceFunctionActionsApi.getByDeviceId(effectiveDeviceId),
        ]);
        const functionsArray = Array.isArray(funcsRes) ? funcsRes : [];
        const actionsArray = Array.isArray(actionsRes) ? actionsRes : [];
        setActions(actionsArray);
        setDeviceFunctions(functionsArray);
      } else {
        setActions([]);
        setDeviceFunctions([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
      setActions([]);
      setDeviceFunctions([]);
    } finally {
      setLoading(false);
    }
  };

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
    if (!effectiveDeviceId && !deviceId && !functionId) {
      showToast(t('admin.selectDevice') || 'Выберите устройство', 'warning');
      setIsDeviceSelectModalOpen(true);
      return;
    }
    setEditingAction(null);
    setFormData({
      code: '',
      deviceFunctionId: functionId ?? deviceFunctions[0]?.id ?? 0,
      actionType: 'TURN_ON',
      payloadTemplate: '',
      translations: {
        en: { locale: 'en', name: '', description: '' },
        ru: { locale: 'ru', name: '', description: '' },
      },
    });
    setIsModalOpen(true);
  };

  const handleEdit = (action: DeviceFunctionActionResponse) => {
    setEditingAction(action);
    setFormData({
      code: action.code,
      deviceFunctionId: action.deviceFunctionId ?? 0,
      actionType: action.actionType,
      payloadTemplate: action.payloadTemplate || '',
      active: action.active,
      translations: action.translations || {
        en: { locale: 'en', name: action.name || '', description: action.description || '' },
        ru: { locale: 'ru', name: action.name || '', description: action.description || '' },
      },
    });
    setIsModalOpen(true);
  };

  const handleDelete = (action: DeviceFunctionActionResponse) => {
    setDeletingAction(action);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAction) return;
    try {
      await deviceFunctionActionsApi.delete(deletingAction.id);
      setIsDeleteModalOpen(false);
      setDeletingAction(null);
      showToast(t('admin.messages.deleteSuccess'), 'success');
      await loadData();
    } catch (error) {
      console.error('Failed to delete action:', error);
      showToast(t('admin.messages.deleteError'), 'error');
    }
  };

  const handleSubmit = async () => {
    // Валидация
    if (!formData.code.trim()) {
      showToast(t('admin.messages.createError'), 'error');
      return;
    }
    if (!formData.deviceFunctionId) {
      showToast('Необходимо выбрать функцию устройства', 'error');
      return;
    }
    if (!formData.translations.en.name.trim() && !formData.translations.ru.name.trim()) {
      showToast('Необходимо указать название хотя бы на одном языке', 'error');
      return;
    }

    try {
      if (editingAction) {
        await deviceFunctionActionsApi.update(editingAction.id, formData);
        showToast(t('admin.messages.updateSuccess'), 'success');
      } else {
        await deviceFunctionActionsApi.create(formData);
        showToast(t('admin.messages.createSuccess'), 'success');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save action:', error);
      showToast(
        editingAction ? t('admin.messages.updateError') : t('admin.messages.createError'),
        'error'
      );
    }
  };

  const actionTypes: Array<{ id: string; label: string }> = [
    { id: 'TURN_ON', label: 'TURN_ON' },
    { id: 'TURN_OFF', label: 'TURN_OFF' },
    { id: 'TOGGLE', label: 'TOGGLE' },
    { id: 'SET_VALUE', label: 'SET_VALUE' },
    { id: 'INCREASE', label: 'INCREASE' },
    { id: 'DECREASE', label: 'DECREASE' },
    { id: 'SEND_NOTIFICATION', label: 'SEND_NOTIFICATION' },
    { id: 'RUN_SCENARIO', label: 'RUN_SCENARIO' },
    { id: 'LOCK', label: 'LOCK' },
    { id: 'UNLOCK', label: 'UNLOCK' },
    { id: 'CUSTOM_COMMAND', label: 'CUSTOM_COMMAND' },
  ];

  const filteredActions = useMemo(() => {
    if (!searchQuery.trim()) return actions;
    const q = searchQuery.toLowerCase();
    return actions.filter((a) => {
      const name = getNameForLocale(a.translations as Record<string, { name?: string }> | undefined, a.name);
      return (
        (a.code || '').toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        (a.actionType || '').toLowerCase().includes(q)
      );
    });
  }, [actions, searchQuery, getNameForLocale]);

  const columns: Column<DeviceFunctionActionResponse>[] = useMemo(
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
      ...(functionId == null
        ? [
            {
              key: 'deviceFunctionId',
              label: t('admin.deviceFunction'),
              render: (row) => {
                const func = deviceFunctions.find((f) => f.id === row.deviceFunctionId);
                const name = func
                  ? getNameForLocale(func.translations as Record<string, { name?: string }> | undefined, func.name) || func.code
                  : null;
                return <span className="text-sm">{name ?? row.deviceFunctionId ?? '—'}</span>;
              },
            } as Column<DeviceFunctionActionResponse>,
          ]
        : []),
      {
        key: 'actionType',
        label: t('admin.actionType'),
        render: (row) => (
          <Badge variant="secondary">
            {row.actionType}
          </Badge>
        ),
      },
    ],
    [t, functionId, deviceFunctions, getNameForLocale]
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
        <Button onClick={loadData} variant="secondary">
          {t('admin.retry')}
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {deviceId && showBackButton && (
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/devices')}
            type="button"
          >
            ← {t('admin.backToDevices')}
          </Button>
          {functionId != null && (
            <Button
              variant="ghost"
              onClick={() => router.push(`/admin/devices/${deviceId}/functions`)}
              type="button"
            >
              ← {t('admin.backToFunctions')}
            </Button>
          )}
        </div>
      )}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-semibold">{t('admin.deviceFunctionActions.title')}</h2>
        <div className="flex gap-2">
          {!deviceId && (
            <Button
              onClick={() => setIsDeviceSelectModalOpen(true)}
              variant="secondary"
              type="button"
            >
              {selectedDeviceId
                ? (t('admin.changeDevice') || 'Сменить устройство')
                : (t('admin.selectDevice') || 'Выбрать устройство')}
            </Button>
          )}
          <Button onClick={handleCreate} type="button">
            {t('admin.create')}
          </Button>
        </div>
      </div>

      {!deviceId && (
        <div className="rounded-lg border border-border bg-muted p-4">
          <p className="text-sm">
            <span className="font-semibold">
              {selectedDeviceId ? (t('admin.selectedDevice') || 'Устройство') : (t('admin.selectDevice') || 'Выберите устройство')}:
            </span>{' '}
            {selectedDeviceId
              ? (() => {
                  const d = devices.find((dev) => dev.id === selectedDeviceId);
                  return d ? getNameForLocale(d.translations as Record<string, { name?: string }> | undefined, d.name) || d.code : selectedDeviceId;
                })()
              : (t('admin.selectDevice') || 'Выберите устройство')}
            {selectedDeviceId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedDeviceId(null);
                  setActions([]);
                  setDeviceFunctions([]);
                }}
                className="ml-2"
                type="button"
              >
                {t('admin.clear')}
              </Button>
            )}
          </p>
        </div>
      )}

      {!effectiveDeviceId && !functionId ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t('admin.selectDevice') || 'Выберите устройство'}</p>
        </div>
      ) : (
        <DataTable
          data={filteredActions}
          columns={columns}
          searchPlaceholder={t('admin.search')}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          loading={loading}
          actions={(action) => (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleEdit(action)}
                    aria-label={t('admin.edit')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                    onClick={() => handleDelete(action)}
                    aria-label={t('admin.delete')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('admin.delete')}</TooltipContent>
              </Tooltip>
            </>
          )}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingAction ? t('admin.editDeviceFunctionAction') : t('admin.createDeviceFunctionAction')}
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
                      placeholder={t('admin.placeholders.codeAction')}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.helpers.codeAction')}
                    </p>
                  </div>
                  <div className="admin-form-full-width space-y-2">
                    <label className="text-sm font-medium">{t('admin.deviceFunction')}</label>
                    <Select
                      value={formData.deviceFunctionId ? formData.deviceFunctionId.toString() : ''}
                      onValueChange={(value) => {
                        if (value) {
                          setFormData({ ...formData, deviceFunctionId: parseInt(value) });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('admin.placeholders.selectDeviceFunction')} />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceFunctions.map((func) => {
                          const displayName = getNameForLocale(func.translations as Record<string, { name?: string }> | undefined, func.name) || func.code;
                          return (
                            <SelectItem key={func.id} value={func.id.toString()}>
                              {displayName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="admin-form-full-width space-y-2">
                    <label className="text-sm font-medium">{t('admin.actionType')}</label>
                    <Select
                      value={formData.actionType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, actionType: value as any })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('admin.placeholders.selectActionType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.helpers.actionType')}
                    </p>
                  </div>
                  <div className="admin-form-full-width space-y-2">
                    <label className="text-sm font-medium">{t('admin.payloadTemplate')}</label>
                    <Textarea
                      placeholder={t('admin.placeholders.payloadTemplate')}
                      value={formData.payloadTemplate || ''}
                      onChange={(e) => setFormData({ ...formData, payloadTemplate: e.target.value })}
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.helpers.payloadTemplate')}
                    </p>
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
                            placeholder={t('admin.placeholders.nameActionRu')}
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
                            placeholder={t('admin.placeholders.descriptionActionRu')}
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
                            placeholder={t('admin.placeholders.nameActionEn')}
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
                            placeholder={t('admin.placeholders.descriptionActionEn')}
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

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.deleteConfirm')}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {t('admin.messages.deleteConfirm')} "{deletingAction ? getNameForLocale(deletingAction.translations as Record<string, { name?: string }> | undefined, deletingAction.name) || deletingAction.code : ''}"?
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

      {/* Device Selection Modal (when not opened from device page) */}
      {!deviceId && (
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
                  setActions([]);
                  setDeviceFunctions([]);
                }}
                className="w-full"
                type="button"
              >
                {t('admin.clear')}
              </Button>
              {devices.map((dev) => {
                const displayName = getNameForLocale(dev.translations as Record<string, { name?: string }> | undefined, dev.name) || dev.code;
                return (
                  <Button
                    key={dev.id}
                    variant={selectedDeviceId === dev.id ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedDeviceId(dev.id);
                      setIsDeviceSelectModalOpen(false);
                    }}
                    className="w-full justify-start"
                    type="button"
                  >
                    {displayName} ({dev.code})
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </TooltipProvider>
  );
}
