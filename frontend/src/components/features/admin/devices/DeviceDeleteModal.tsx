'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DeviceResponse } from '@/types/api';

interface DeviceDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceResponse | null;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  message: string;
  warningMessage: string;
}

export function DeviceDeleteModal({
  isOpen,
  onOpenChange,
  device,
  onConfirm,
  onCancel,
  title,
  confirmLabel,
  cancelLabel,
  message,
  warningMessage,
}: DeviceDeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {message} &quot;{device?.name}&quot;?
        </DialogDescription>
        <p className="text-xs text-warning dark:text-warning/85">{warningMessage}</p>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
