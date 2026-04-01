'use client';

import { useEffect, useState } from 'react';
import { AppButton } from '@/components/ui/app-button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks';
import type { HouseRoleCreateRequest, HouseRoleResponse } from '@/types/api';

interface EditRoleModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  role: HouseRoleResponse | null;
  onSubmit: (roleId: string, data: HouseRoleCreateRequest) => Promise<HouseRoleResponse>;
}

export function EditRoleModal({
  isOpen,
  onOpenChange,
  role,
  onSubmit,
}: EditRoleModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [priorityStr, setPriorityStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priorityError, setPriorityError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && role) {
      setName(role.name ?? role.code ?? '');
      setPriorityStr(role.priority !== undefined ? String(role.priority) : '');
      setNameError(null);
      setPriorityError(null);
    } else if (!isOpen) {
      setName('');
      setPriorityStr('');
      setNameError(null);
      setPriorityError(null);
    }
  }, [isOpen, role]);

  const validate = (): boolean => {
    let valid = true;
    if (!name.trim()) {
      setNameError(t('admin.accessControl.roleNameRequired'));
      valid = false;
    } else {
      setNameError(null);
    }
    if (priorityStr !== '') {
      const n = Number(priorityStr);
      if (Number.isNaN(n) || !Number.isInteger(n)) {
        setPriorityError(t('admin.accessControl.rolePriorityInvalid'));
        valid = false;
      } else {
        setPriorityError(null);
      }
    } else {
      setPriorityError(null);
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!role || !validate()) return;
    setLoading(true);
    try {
      const priority = priorityStr === '' ? undefined : Number(priorityStr);
      await onSubmit(role.id, { name: name.trim(), priority });
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setNameError(null);
      setPriorityError(null);
    }
    onOpenChange(open);
  };

  if (!role) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.accessControl.editRole')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="edit-role-name"
              className="text-sm font-medium text-foreground"
            >
              {t('admin.accessControl.rolesTableRole')}
            </label>
            <Input
              id="edit-role-name"
              placeholder={t('admin.accessControl.rolesTableRole')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p className="text-xs text-destructive" role="alert">
                {nameError}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label
              htmlFor="edit-role-priority"
              className="text-sm font-medium text-foreground"
            >
              {t('admin.accessControl.rolesTablePriority')}
            </label>
            <Input
              id="edit-role-priority"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={priorityStr}
              onChange={(e) => {
                setPriorityStr(e.target.value);
                if (priorityError) setPriorityError(null);
              }}
              aria-invalid={!!priorityError}
            />
            {priorityError && (
              <p className="text-xs text-destructive" role="alert">
                {priorityError}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <AppButton variant="secondary" onClick={() => handleClose(false)}>
            {t('common.cancel')}
          </AppButton>
          <AppButton onClick={handleSubmit} disabled={loading || !name.trim()}>
            {t('common.save')}
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
