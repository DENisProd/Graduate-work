'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { useRoomPlannerStore } from '@/store/room-planner-store';
import { Toolbar, CatalogPanel, PropertyPanel } from '@/components/features/admin/room-planner';

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

  useEffect(() => {
    if (houseId) {
      initialize(houseId);
    }
  }, [houseId, initialize]);

  if (!houseId) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden p-4 gap-4 bg-gray-50 dark:bg-gray-900">
        <CatalogPanel />
        <Card className="flex-1 relative overflow-hidden gap-0 py-0 bg-white dark:bg-black">
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
