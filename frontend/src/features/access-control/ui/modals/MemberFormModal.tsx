'use client';

import { useState } from 'react';
import { AppButton } from '@/components/ui/app-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks';

interface MemberFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: number | string;
  onSubmit: (userId: string) => Promise<void>;
}

export function MemberFormModal({
  isOpen,
  onOpenChange,
  onSubmit,
}: MemberFormModalProps) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await onSubmit(userId);
      setUserId('');
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) setUserId('');
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.accessControl.addMember')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <label htmlFor="member-user-id" className="text-sm font-medium text-foreground">
            {t('admin.accessControl.userId')}
          </label>
          <Input
            id="member-user-id"
            placeholder={t('admin.accessControl.placeholders.userId')}
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <DialogFooter>
          <AppButton variant="secondary" onClick={() => handleClose(false)}>
            {t('common.cancel')}
          </AppButton>
          <AppButton onClick={handleSubmit} disabled={loading || !userId.trim()}>
            {t('admin.create')}
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
