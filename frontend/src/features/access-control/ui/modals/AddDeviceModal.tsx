'use client';

import { useEffect, useState } from 'react';
import { AppButton } from '@/components/ui/app-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { deviceTypesApi, deviceCategoriesApi } from '@/lib/api-client';
import type { DeviceTypeResponse, DeviceCategoryResponse, HouseDeviceRegistrationRequest } from '@/types/api';
import { useTranslation } from '@/hooks';
import { AdminSelect } from '@/components/shared/AdminSelect';
import { getDisplayName } from '../../lib/utils';
import type { AddDeviceStep } from '@/store/add-device-modal-store';

interface AddDeviceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string | null;
  step: AddDeviceStep;
  formData: {
    deviceTypeId: number | null;
    deviceCategoryId: number | null;
    name: string;
    serialNumber: string;
    firmwareVersion: string;
  };
  isLoading: boolean;
  onStepChange: (step: AddDeviceStep) => void;
  onFormDataChange: (data: Partial<AddDeviceModalProps['formData']>) => void;
  onSetLoading: (loading: boolean) => void;
  onSubmit: (data: HouseDeviceRegistrationRequest) => Promise<void>;
  onClose: () => void;
}

export function AddDeviceModal({
  isOpen,
  onOpenChange,
  houseId,
  step,
  formData,
  isLoading,
  onStepChange,
  onFormDataChange,
  onSetLoading,
  onSubmit,
  onClose,
}: AddDeviceModalProps) {
  const { t, locale } = useTranslation();
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeResponse[]>([]);
  const [categories, setCategories] = useState<DeviceCategoryResponse[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOptionsLoading(true);
    deviceTypesApi
      .getAll()
      .then((list) => setDeviceTypes(Array.isArray(list) ? list : []))
      .catch(() => setDeviceTypes([]))
      .finally(() => setOptionsLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!formData.deviceTypeId) {
      setCategories([]);
      return;
    }
    setOptionsLoading(true);
    deviceCategoriesApi
      .getByDeviceTypeId(formData.deviceTypeId)
      .then((list) => setCategories(Array.isArray(list) ? list : []))
      .catch(() => setCategories([]))
      .finally(() => setOptionsLoading(false));
  }, [formData.deviceTypeId]);

  const typeOptions = deviceTypes.map((item) => ({
    id: String(item.id),
    text: getDisplayName(item.translations as Record<string, { name?: string }>, item.name, item.code, locale) || item.code || String(item.id),
  }));
  const categoryOptions = categories.map((item) => ({
    id: String(item.id),
    text: getDisplayName(item.translations as Record<string, { name?: string }>, item.name, item.code, locale) || item.code || String(item.id),
  }));

  const selectedTypeName = formData.deviceTypeId
    ? typeOptions.find((o) => o.id === String(formData.deviceTypeId))?.text ?? String(formData.deviceTypeId)
    : '—';
  const selectedCategoryName = formData.deviceCategoryId
    ? categoryOptions.find((o) => o.id === String(formData.deviceCategoryId))?.text ?? String(formData.deviceCategoryId)
    : '—';

  const canProceedStep1 = formData.deviceTypeId != null && formData.deviceCategoryId != null;
  const canProceedStep2 = true;

  const handleClose = (open: boolean) => {
    if (!open) onClose();
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('admin.accessControl.addDevice.title')}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden">
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('admin.accessControl.addDevice.step1Description')}
              </p>
              <AdminSelect
                label={t('admin.deviceType')}
                placeholder={t('admin.accessControl.addDevice.selectType')}
                value={formData.deviceTypeId != null ? String(formData.deviceTypeId) : null}
                onChange={(v) => {
                  onFormDataChange({
                    deviceTypeId: v ? Number(v) : null,
                    deviceCategoryId: null,
                  });
                }}
                options={typeOptions}
                isDisabled={optionsLoading}
              />
              <AdminSelect
                label={t('admin.deviceCategory')}
                placeholder={t('admin.accessControl.addDevice.selectCategory')}
                value={formData.deviceCategoryId != null ? String(formData.deviceCategoryId) : null}
                onChange={(v) => onFormDataChange({ deviceCategoryId: v ? Number(v) : null })}
                options={categoryOptions}
                isDisabled={optionsLoading || !formData.deviceTypeId}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('admin.accessControl.addDevice.step2Description')}
              </p>
              <div className="space-y-1">
                <label htmlFor="device-name" className="text-sm font-medium text-foreground">
                  {t('admin.name')}
                </label>
                <Input
                  id="device-name"
                  placeholder={t('admin.placeholders.name')}
                  value={formData.name}
                  onChange={(e) => onFormDataChange({ name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="device-serial" className="text-sm font-medium text-foreground">
                  {t('admin.serialNumber')}
                </label>
                <Input
                  id="device-serial"
                  placeholder={t('admin.accessControl.addDevice.serialNumberPlaceholder')}
                  value={formData.serialNumber}
                  onChange={(e) => onFormDataChange({ serialNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="device-firmware" className="text-sm font-medium text-foreground">
                  {t('admin.firmwareVersion')}
                </label>
                <Input
                  id="device-firmware"
                  placeholder={t('admin.accessControl.addDevice.firmwarePlaceholder')}
                  value={formData.firmwareVersion}
                  onChange={(e) => onFormDataChange({ firmwareVersion: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2 rounded-lg border border-border bg-surface-2 p-4 text-sm">
              <p className="font-medium text-foreground">
                {t('admin.accessControl.addDevice.confirmTitle')}
              </p>
              <div className="grid gap-1 text-muted-foreground">
                <span>{t('admin.deviceType')}: {selectedTypeName}</span>
                <span>{t('admin.deviceCategory')}: {selectedCategoryName}</span>
                {formData.name && <span>{t('admin.name')}: {formData.name}</span>}
                {formData.serialNumber && <span>{t('admin.serialNumber')}: {formData.serialNumber}</span>}
                {formData.firmwareVersion && <span>{t('admin.firmwareVersion')}: {formData.firmwareVersion}</span>}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {step > 1 ? (
              <AppButton
                variant="secondary"
                onClick={() => onStepChange((step - 1) as AddDeviceStep)}
                disabled={isLoading}
              >
                {t('admin.previous')}
              </AppButton>
            ) : (
              <AppButton variant="secondary" onClick={() => handleClose(false)}>
                {t('common.cancel')}
              </AppButton>
            )}
          </div>
          <div className="flex gap-2">
            {step < 3 ? (
              <AppButton
                onClick={() => onStepChange((step + 1) as AddDeviceStep)}
                disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2) || optionsLoading}
              >
                {t('admin.next')}
              </AppButton>
            ) : (
              <AppButton
                onClick={async () => {
                  if (formData.deviceTypeId == null || formData.deviceCategoryId == null) return;
                  onSetLoading(true);
                  try {
                    const payload: HouseDeviceRegistrationRequest = {
                      deviceTypeId: formData.deviceTypeId,
                      deviceCategoryId: formData.deviceCategoryId,
                      name: formData.name.trim() || undefined,
                      serialNumber: formData.serialNumber.trim() || undefined,
                      firmwareVersion: formData.firmwareVersion.trim() || undefined,
                    };
                    await onSubmit(payload);
                    onClose();
                  } finally {
                    onSetLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                {t('admin.accessControl.addDevice.submit')}
              </AppButton>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
