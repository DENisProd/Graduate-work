'use client';

import { useState } from 'react';
import { Button, Input, Modal } from '@heroui/react';
import { useUserStore } from '@/store';
import { useTranslation } from '@/hooks';
import type { CurrentUser } from '@/types';

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Mock login: enter user ID only. Creates a fake user and stores in global state. */
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
    <Modal isOpen={isOpen} onOpenChange={handleClose}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-md overflow-hidden rounded-xl">
            <Modal.Header className="rounded-t-xl border-b border-border">
              <Modal.Heading>{t('auth.mockLoginTitle')}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-4 py-4">
              <Input
                placeholder={t('admin.accessControl.placeholders.userId')}
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </Modal.Body>
            <Modal.Footer className="rounded-b-xl border-t border-border">
              <Button variant="secondary" onPress={() => handleClose(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmit}
                isDisabled={!userId.trim()}
              >
                {t('auth.login')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
