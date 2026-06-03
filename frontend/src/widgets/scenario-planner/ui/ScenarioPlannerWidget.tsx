'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { useScenarioPlannerStore } from '@/store/scenario-planner-store';
import { Toolbar, CatalogPanel, PropertyPanel } from '@/components/features/admin/scenario-planner';

const CanvasStage = dynamic(
  () => import('@/presentation/scenario-planner/CanvasStage').then((mod) => ({ default: mod.CanvasStage })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    ),
  }
);

export function ScenarioPlannerWidget(props: { houseId?: string }) {
  const params = useParams();
  const houseId = props.houseId ?? (params?.houseId as string);
  const initialize = useScenarioPlannerStore((s) => s.initialize);
  const storeHouseId = useScenarioPlannerStore((s) => s.houseId);
  const nodesCount = useScenarioPlannerStore((s) => s.nodes.length);

  useEffect(() => {
    if (!houseId) return;
    if (storeHouseId === houseId && nodesCount > 2) return;
    initialize(houseId);
  }, [houseId, initialize, nodesCount, storeHouseId]);

  if (!houseId) return null;

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
        <PropertyPanel />
      </div>
    </div>
  );
}

