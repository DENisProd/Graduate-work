'use client';

import { DataTable, type Column } from '@/components/shared/DataTable';
import { AppButton } from '@/components/ui/app-button';
import { useTranslation } from '@/hooks';
import { useAccessControlStore } from '@/store/access-control-store';
import { DoorOpen } from 'lucide-react';
import type { HouseRoomResponse } from '@/types/api';

interface RoomsTabProps {
  houseIdParam: string | undefined;
  onRoomPlanner: () => void;
  isAdmin: boolean;
}

export function RoomsTab({ houseIdParam, onRoomPlanner, isAdmin }: RoomsTabProps) {
  if (isAdmin) {
    return <AdminRoomsTab houseIdParam={houseIdParam} onRoomPlanner={onRoomPlanner} />;
  }

  return <RegularRoomsTab houseIdParam={houseIdParam} onRoomPlanner={onRoomPlanner} />;
}

interface RoomsTabVariantProps {
  houseIdParam: string | undefined;
  onRoomPlanner: () => void;
}

function AdminRoomsTab({ houseIdParam, onRoomPlanner }: RoomsTabVariantProps) {
  const { t } = useTranslation();
  const rooms = useAccessControlStore((s) => s.rooms);
  const setRoomModalOpen = useAccessControlStore((s) => s.setRoomModalOpen);
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
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <AppButton onClick={() => setRoomModalOpen(true)}>
          {t('admin.create')} — {t('admin.accessControl.houseRooms')}
        </AppButton>
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

function RegularRoomsTab({ houseIdParam, onRoomPlanner }: RoomsTabVariantProps) {
  const { t } = useTranslation();
  const rooms = useAccessControlStore((s) => s.rooms);
  const setRoomModalOpen = useAccessControlStore((s) => s.setRoomModalOpen);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <AppButton onClick={() => setRoomModalOpen(true)}>
          {t('admin.create')} — {t('admin.accessControl.houseRooms')}
        </AppButton>
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
              <div className="min-w-0">
                <h4 className="truncate font-medium text-foreground">{room.name ?? room.externalId ?? '—'}</h4>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
