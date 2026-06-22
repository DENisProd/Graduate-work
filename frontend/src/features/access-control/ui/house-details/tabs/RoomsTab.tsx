'use client';

import { useState } from 'react';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { AppButton } from '@/components/ui/app-button';
import { useTranslation } from '@/hooks';
import { useAccessControlStore } from '@/store/access-control-store';
import { DoorOpen, Trash2 } from 'lucide-react';
import type { HouseRoomResponse } from '@/types/api';

interface RoomsTabProps {
  houseIdParam: string | undefined;
  onRoomPlanner: () => void;
  isAdmin: boolean;
  canManage?: boolean;
}

export function RoomsTab({ houseIdParam, onRoomPlanner, isAdmin, canManage = true }: RoomsTabProps) {
  if (isAdmin) {
    return <AdminRoomsTab houseIdParam={houseIdParam} onRoomPlanner={onRoomPlanner} canManage={canManage} />;
  }

  return <RegularRoomsTab houseIdParam={houseIdParam} onRoomPlanner={onRoomPlanner} canManage={canManage} />;
}

interface RoomsTabVariantProps {
  houseIdParam: string | undefined;
  onRoomPlanner: () => void;
  canManage?: boolean;
}

function useRoomDelete() {
  const deleteRoom = useAccessControlStore((s) => s.deleteRoom);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (room: HouseRoomResponse) => {
    const name = room.name ?? room.externalId ?? room.id;
    const confirmed = window.confirm(`Удалить комнату «${name}»? Вложенные устройства и права также будут удалены.`);
    if (!confirmed) return;

    setDeletingId(String(room.id));
    try {
      await deleteRoom(String(room.id));
    } finally {
      setDeletingId(null);
    }
  };

  return { deletingId, handleDelete };
}

function AdminRoomsTab({ houseIdParam, onRoomPlanner, canManage = true }: RoomsTabVariantProps) {
  const { t } = useTranslation();
  const rooms = useAccessControlStore((s) => s.rooms);
  const setRoomModalOpen = useAccessControlStore((s) => s.setRoomModalOpen);
  const { deletingId, handleDelete } = useRoomDelete();

  const columns: Column<HouseRoomResponse>[] = [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: t('admin.name'),
      render: (room) => room.name ?? room.externalId ?? '—',
    },
    {
      key: 'houseName',
      label: t('admin.accessControl.houses'),
      render: (room) => room.houseName ?? '—',
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            label: t('admin.delete'),
            render: (room: HouseRoomResponse) => (
              <AppButton
                size="sm"
                variant="destructive"
                disabled={deletingId === String(room.id)}
                onClick={() => void handleDelete(room)}
              >
                {t('admin.delete')}
              </AppButton>
            ),
          } satisfies Column<HouseRoomResponse>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {canManage && (
          <AppButton onClick={() => setRoomModalOpen(true)}>
            {t('admin.create')} — {t('admin.accessControl.houseRooms')}
          </AppButton>
        )}
        {houseIdParam && (
          <AppButton variant="secondary" onClick={onRoomPlanner}>
            {t('admin.roomPlanner.title')}
          </AppButton>
        )}
      </div>

      <DataTable<HouseRoomResponse> data={rooms} columns={columns} />
    </div>
  );
}

function RegularRoomsTab({ houseIdParam, onRoomPlanner, canManage = true }: RoomsTabVariantProps) {
  const { t } = useTranslation();
  const rooms = useAccessControlStore((s) => s.rooms);
  const setRoomModalOpen = useAccessControlStore((s) => s.setRoomModalOpen);
  const { deletingId, handleDelete } = useRoomDelete();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {canManage && (
          <AppButton onClick={() => setRoomModalOpen(true)}>
            {t('admin.create')} — {t('admin.accessControl.houseRooms')}
          </AppButton>
        )}
        {houseIdParam && (
          <AppButton variant="secondary" onClick={onRoomPlanner}>
            {t('admin.roomPlanner.title')}
          </AppButton>
        )}
      </div>

      {rooms.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-md"
            >
              <div
                role="img"
                aria-label={room.name ?? room.externalId ?? ''}
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted to-muted/40"
              >
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <DoorOpen className="h-5 w-5" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-medium text-foreground">{room.name ?? room.externalId ?? '—'}</h4>
              </div>
              {canManage && (
                <AppButton
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deletingId === String(room.id)}
                  onClick={() => void handleDelete(room)}
                  aria-label={t('admin.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </AppButton>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
