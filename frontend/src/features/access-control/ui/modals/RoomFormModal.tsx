'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppButton } from '@/components/ui/app-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminSelect } from '@/components/shared/AdminSelect';
import { houseRoomsApi } from '@/lib/api-client';
import type { HouseRoomRequest, HouseRoomResponse } from '@/types/api';
import { useTranslation } from '@/hooks';
import { toArray } from '../../lib/utils';

interface RoomFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: number | string;
  onSubmit: (data: HouseRoomRequest) => Promise<void>;
}

export function RoomFormModal({
  isOpen,
  onOpenChange,
  houseId,
  onSubmit,
}: RoomFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>('__auto__');
  const [rooms, setRooms] = useState<HouseRoomResponse[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingOptions(true);
    houseRoomsApi
      .getByHouseId(houseId)
      .then((data) => setRooms(toArray<HouseRoomResponse>(data)))
      .catch(() => setRooms([]))
      .finally(() => setLoadingOptions(false));
  }, [isOpen, houseId]);

  const parentOptions = useMemo(
    () => [
      { id: '__auto__', text: 'Нет' },
      ...rooms.map((room) => ({
        id: String(room.id),
        text: `${room.name ?? room.externalId ?? '—'} (${room.id})`,
      })),
    ],
    [rooms]
  );

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        houseId,
        parentId: parentId && parentId !== '__auto__' ? parentId : undefined,
      });
      setName('');
      setParentId('__auto__');
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setName('');
      setParentId('__auto__');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.create')} — {t('admin.accessControl.houseRooms')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="room-name" className="text-sm font-medium text-foreground">
              {t('admin.name')}
            </label>
            <Input
              id="room-name"
              placeholder={t('admin.placeholders.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <AdminSelect
            label="Родительская комната"
            placeholder="Выберите родителя или оставьте авто"
            value={parentId}
            onChange={setParentId}
            options={parentOptions}
            className="w-full"
            isDisabled={loadingOptions}
          />
        </div>
        <DialogFooter>
          <AppButton variant="secondary" onClick={() => handleClose(false)}>
            {t('common.cancel')}
          </AppButton>
          <AppButton onClick={handleSubmit} disabled={loading || !name.trim()}>
            {t('admin.create')}
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
