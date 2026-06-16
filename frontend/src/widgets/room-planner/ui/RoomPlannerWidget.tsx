'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { useRoomPlannerStore } from '@/store/room-planner-store';
import { Toolbar, CatalogPanel, PropertyPanel } from '@/components/features/admin/room-planner';
import { AUTOSAVE_INTERVAL_MS } from '@/infrastructure/room-planner/storage';
import { useToast } from '@/components/shared';
import { useTranslation } from '@/hooks';

const CanvasStage = dynamic(
  () => import('@/presentation/room-planner/CanvasStage').then((mod) => ({ default: mod.CanvasStage })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    ),
  }
);

export function RoomPlannerWidget() {
  const params = useParams();
  const houseId = params?.houseId as string;
  const initialize = useRoomPlannerStore((state) => state.initialize);
  const isDirty = useRoomPlannerStore((state) => state.isDirty);
  const isLoading = useRoomPlannerStore((state) => state.isLoading);
  const { showToast } = useToast();
  const { t } = useTranslation();
  const autosaveErrorToastTsRef = useRef(0);

  useEffect(() => {
    if (houseId) {
      initialize(houseId);
    }
  }, [houseId, initialize]);

  useEffect(() => {
    if (!houseId) return;

    const intervalId = window.setInterval(async () => {
      if (!useRoomPlannerStore.getState().isDirty) return;

      const result = await useRoomPlannerStore.getState().saveProject();
      if (result === true) {
        showToast(t('admin.roomPlanner.autosaveSuccess'), 'success', 3000);
        return;
      }

      const now = Date.now();
      if (now - autosaveErrorToastTsRef.current > 6000) {
        autosaveErrorToastTsRef.current = now;
        showToast(
          result === 'conflict'
            ? t('admin.roomPlanner.saveConflict')
            : t('admin.roomPlanner.saveError'),
          'warning',
          4000,
        );
      }
    }, AUTOSAVE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [houseId, showToast, t]);

  useEffect(() => {
    if (!houseId || !isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [houseId, isDirty]);

  if (!houseId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden gap-4 bg-surface-2 p-4">
        <CatalogPanel />
        <Card className="relative flex-1 gap-0 overflow-hidden bg-card py-0">
          <CardContent className="h-full p-0">
            <CanvasStage />
          </CardContent>
        </Card>
        <Card className="h-full w-[300px] overflow-hidden">
          <CardContent className="h-full p-0">
            <PropertyPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
