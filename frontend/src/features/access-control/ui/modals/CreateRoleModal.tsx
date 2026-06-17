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
import { applyApiValidationErrors } from '@/lib/api-client';
import type { HouseRoleCreateRequest } from '@/types/api';

interface CreateRoleModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string | null;
  onSubmit: (data: HouseRoleCreateRequest) => Promise<void>;
}

export function CreateRoleModal({
  isOpen,
  onOpenChange,
  houseId,
  onSubmit,
}: CreateRoleModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [priorityStr, setPriorityStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priorityError, setPriorityError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const clearErrors = () => {
    setNameError(null);
    setPriorityError(null);
    setFormError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPriorityStr('');
      clearErrors();
    }
  }, [isOpen]);

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
      } else if (n < 1) {
        setPriorityError(t('admin.accessControl.rolePriorityMin'));
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
    if (!validate() || !houseId) return;
    setLoading(true);
    setFormError(null);
    try {
      const priority = priorityStr === '' ? undefined : Number(priorityStr);
      await onSubmit({ name: name.trim(), priority });
      onOpenChange(false);
    } catch (error) {
      applyApiValidationErrors(error, {
        setFieldError: (field, message) => {
          if (field === 'name') setNameError(message);
          if (field === 'priority') setPriorityError(message);
        },
        setFormError,
      }, t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setName('');
      setPriorityStr('');
      clearErrors();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.accessControl.createRole')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {formError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}
          <div className="space-y-1">
            <label
              htmlFor="create-role-name"
              className="text-sm font-medium text-foreground"
            >
              {t('admin.accessControl.rolesTableRole')}
            </label>
            <Input
              id="create-role-name"
              placeholder={t('admin.accessControl.rolesTableRole')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
                if (formError) setFormError(null);
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
              htmlFor="create-role-priority"
              className="text-sm font-medium text-foreground"
            >
              {t('admin.accessControl.rolesTablePriority')}
            </label>
            <Input
              id="create-role-priority"
              type="text"
              inputMode="numeric"
              placeholder="1"
              value={priorityStr}
              onChange={(e) => {
                setPriorityStr(e.target.value);
                if (priorityError) setPriorityError(null);
                if (formError) setFormError(null);
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
          <AppButton
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
          >
            {t('admin.create')}
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
