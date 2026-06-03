'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserStore } from '@/store';
import { useTranslation } from '@/hooks';
import type { CurrentUser } from '@/types';

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ isOpen, onOpenChange }: LoginModalProps) {
  const { t } = useTranslation();
  const setUser = useUserStore((s) => s.setUser);
  const [userId, setUserId] = useState('');

  const handleSubmit = () => {
    const id = userId.trim();
    if (!id) return;
    const user: CurrentUser = {
      id,
      name: `User ${id}`,
    };
    setUser(user);
    setUserId('');
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) setUserId('');
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('auth.mockLoginTitle')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('auth.mockLoginTitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            placeholder={t('admin.accessControl.placeholders.userId')}
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => handleClose(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isDisabled={!userId.trim()}
          >
            {t('auth.login')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
