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

      {isAdmin ? (
          <DataTable<HouseRoomResponse>
            data={rooms}
            columns={columns}
          />
      ) : rooms.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-md"
            >
              <div
                role="img"
                aria-label={room.name ?? room.externalId ?? ''}
                className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted to-muted/40"
              >
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <DoorOpen className="h-7 w-7" />
                </div>
              </div>
              <h4 className="font-medium text-foreground">{room.name ?? room.externalId ?? '—'}</h4>
              {room.houseName && (
                <p className="mt-0.5 text-sm text-muted-foreground">{room.houseName}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">ID: {room.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
