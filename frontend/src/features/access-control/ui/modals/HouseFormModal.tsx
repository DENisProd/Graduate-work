'use client';

import { useEffect, useState } from 'react';
import { AppButton } from '@/components/ui/app-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { HouseRequest, HouseResponse } from '@/types/api';
import { useTranslation } from '@/hooks';

interface HouseFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: HouseResponse | null;
  onSubmit: (data: HouseRequest) => Promise<void>;
}

const emptyForm: HouseRequest = {
  name: '',
  avatarUrl: '',
  address: '',
};

export function HouseFormModal({
  isOpen,
  onOpenChange,
  initialValues,
  onSubmit,
}: HouseFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<HouseRequest>(emptyForm);
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(initialValues?.id);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialValues
          ? {
              name: initialValues.name,
              avatarUrl: initialValues.avatarUrl ?? '',
              address: initialValues.address ?? '',
            }
          : emptyForm
      );
    }
  }, [isOpen, initialValues]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('admin.edit') : t('admin.create')} — {t('admin.accessControl.houses')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="house-name" className="text-sm font-medium text-foreground">
              {t('admin.name')}
            </label>
            <Input
              id="house-name"
              placeholder={t('admin.placeholders.houseName')}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="house-avatar" className="text-sm font-medium text-foreground">
              Avatar URL
            </label>
            <Input
              id="house-avatar"
              placeholder="https://..."
              value={form.avatarUrl ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="house-address" className="text-sm font-medium text-foreground">
              {t('admin.description')}
            </label>
            <Input
              id="house-address"
              placeholder={t('admin.placeholders.description')}
              value={form.address ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <AppButton variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </AppButton>
          <AppButton onClick={handleSubmit} disabled={loading}>
            {isEdit ? t('common.save') : t('admin.create')}
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
