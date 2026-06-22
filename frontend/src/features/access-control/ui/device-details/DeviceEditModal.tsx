'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminSelect } from '@/components/shared/AdminSelect';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import {
  ApiError,
  deviceCategoriesApi,
  deviceTypesApi,
  devicesApi,
  physicalDevicesApi,
} from '@/lib/api-client';
import type { DeviceResponse, DeviceTypeResponse, PhysicalDeviceResponse } from '@/types/api';
import { getDisplayName, toArray } from '@/features/access-control/lib/utils';

interface DeviceEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string;
  device: PhysicalDeviceResponse;
  onSaved: (device: PhysicalDeviceResponse) => void;
}

function parseCatalogDeviceId(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function DeviceEditModal({
  isOpen,
  onOpenChange,
  houseId,
  device,
  onSaved,
}: DeviceEditModalProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState<string | null>(null);
  const [catalogDeviceId, setCatalogDeviceId] = useState<string | null>(null);
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeResponse[]>([]);
  const [catalogDevices, setCatalogDevices] = useState<DeviceResponse[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [saving, setSaving] = useState(false);

  const labelForType = useCallback(
    (dt: DeviceTypeResponse) => getDisplayName(dt.translations, dt.name, dt.code, locale),
    [locale],
  );

  const labelForDevice = useCallback(
    (d: DeviceResponse) => getDisplayName(d.translations, d.name, d.code, locale),
    [locale],
  );

  const resetForm = useCallback(() => {
    setName(device.name?.trim() ?? device.friendlyName?.trim() ?? '');
    setDeviceTypeId(device.deviceTypeId != null ? String(device.deviceTypeId) : null);
    const catalogId = parseCatalogDeviceId(device.deviceId);
    setCatalogDeviceId(catalogId != null ? String(catalogId) : null);
  }, [device]);

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
    setLoadingOptions(true);
    void deviceTypesApi
      .getAll()
      .then((data) => setDeviceTypes(toArray<DeviceTypeResponse>(data)))
      .catch(() => setDeviceTypes([]))
      .finally(() => setLoadingOptions(false));
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen) return;
    const typeNum = deviceTypeId ? Number(deviceTypeId) : null;
    if (!typeNum || !Number.isFinite(typeNum)) {
      setCatalogDevices([]);
      return;
    }

    let cancelled = false;
    setLoadingDevices(true);
    void (async () => {
      try {
        const categories = await deviceCategoriesApi.getByDeviceTypeId(typeNum);
        const lists = await Promise.all(
          categories.map((c) => devicesApi.getByCategory(c.id).catch(() => [] as DeviceResponse[])),
        );
        if (cancelled) return;
        const merged = lists.flat();
        const byId = new Map<number, DeviceResponse>();
        for (const d of merged) byId.set(d.id, d);
        const currentCatalogId = parseCatalogDeviceId(device.deviceId);
        if (currentCatalogId != null && !byId.has(currentCatalogId)) {
          const current = await devicesApi.getById(currentCatalogId).catch(() => null);
          if (current) byId.set(current.id, current);
        }
        setCatalogDevices([...byId.values()].sort((a, b) => labelForDevice(a).localeCompare(labelForDevice(b))));
      } catch {
        if (!cancelled) setCatalogDevices([]);
      } finally {
        if (!cancelled) setLoadingDevices(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [device.deviceId, deviceTypeId, isOpen, labelForDevice]);

  const typeOptions = useMemo(
    () => deviceTypes.map((dt) => ({ id: String(dt.id), text: labelForType(dt) })),
    [deviceTypes, labelForType],
  );

  const catalogOptions = useMemo(
    () => catalogDevices.map((d) => ({ id: String(d.id), text: labelForDevice(d) })),
    [catalogDevices, labelForDevice],
  );

  const handleTypeChange = (value: string | null) => {
    setDeviceTypeId(value);
    setCatalogDeviceId(null);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast(t('admin.accessControl.connectedDevices.deviceDetails.nameRequired'), 'error');
      return;
    }

    const typeNum = deviceTypeId ? Number(deviceTypeId) : null;
    const catalogNum = catalogDeviceId ? Number(catalogDeviceId) : null;
    const selectedCatalog = catalogNum
      ? catalogDevices.find((d) => d.id === catalogNum)
      : undefined;

    setSaving(true);
    try {
      const updated = await physicalDevicesApi.update(device.id, {
        houseId,
        name: trimmed,
        ...(typeNum && Number.isFinite(typeNum) ? { deviceTypeId: typeNum } : { deviceTypeId: null }),
        ...(catalogNum && Number.isFinite(catalogNum)
          ? {
              deviceId: catalogNum,
              ...(selectedCatalog?.deviceCategoryId
                ? { deviceCategoryId: selectedCatalog.deviceCategoryId }
                : {}),
            }
          : { deviceId: null }),
      });
      onSaved(updated);
      showToast(t('admin.messages.updateSuccess'), 'success');
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        showToast(t('errors.unauthorized'), 'error');
      } else {
        showToast(t('admin.messages.updateError'), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const detailsKey = 'admin.accessControl.connectedDevices.deviceDetails';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`${detailsKey}.editTitle`)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="device-edit-name">
              {t(`${detailsKey}.fields.friendlyName`)}
            </label>
            <Input
              id="device-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('admin.accessControl.pairing.deviceNamePlaceholder')}
            />
          </div>

          <AdminSelect
            label={t(`${detailsKey}.fields.deviceType`)}
            placeholder={t(`${detailsKey}.selectDeviceType`)}
            value={deviceTypeId}
            onChange={handleTypeChange}
            options={typeOptions}
            isDisabled={loadingOptions || saving}
          />

          <AdminSelect
            label={t(`${detailsKey}.fields.deviceCatalog`)}
            placeholder={
              loadingDevices
                ? t('common.loading')
                : deviceTypeId
                  ? t(`${detailsKey}.selectDeviceCatalog`)
                  : t(`${detailsKey}.selectDeviceTypeFirst`)
            }
            value={catalogDeviceId}
            onChange={setCatalogDeviceId}
            options={catalogOptions}
            isDisabled={!deviceTypeId || loadingDevices || saving}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving || loadingOptions}>
            {saving ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
