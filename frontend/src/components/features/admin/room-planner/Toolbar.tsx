'use client';

import { Button, ButtonGroup } from '@heroui/react';
import { DoorOpen, Hand, Home, MousePointer2, Plug, Square } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/animate-ui/components/radix/tabs';
import { useRoomPlannerStore } from '@/store/room-planner-store';
import { useTranslation } from '@/hooks';
import type { ProjectMode } from '@/domain/room-planner';

export function Toolbar() {
  const { t } = useTranslation();
  const mode = useRoomPlannerStore((state) => state.mode);
  const wallEditMode = useRoomPlannerStore((state) => state.wallEditMode);
  const zoom = useRoomPlannerStore((state) => state.zoom);
  const historyIndex = useRoomPlannerStore((state) => state.historyIndex);
  const history = useRoomPlannerStore((state) => state.history);
  const setMode = useRoomPlannerStore((state) => state.setMode);
  const setWallEditMode = useRoomPlannerStore((state) => state.setWallEditMode);
  const setZoom = useRoomPlannerStore((state) => state.setZoom);
  const undo = useRoomPlannerStore((state) => state.undo);
  const redo = useRoomPlannerStore((state) => state.redo);
  const closeRoom = useRoomPlannerStore((state) => state.closeRoom);
  const exportProject = useRoomPlannerStore((state) => state.exportProject);
  const reset = useRoomPlannerStore((state) => state.reset);
  const room = useRoomPlannerStore((state) => state.room);
  const showMeasurements = useRoomPlannerStore((state) => state.showMeasurements);
  const setShowMeasurements = useRoomPlannerStore((state) => state.setShowMeasurements);
  const showGrid = useRoomPlannerStore((state) => state.showGrid);
  const setShowGrid = useRoomPlannerStore((state) => state.setShowGrid);
  const pendingWallStart = useRoomPlannerStore((state) => state.pendingWallStart);
  const pendingRegionPoints = useRoomPlannerStore((state) => state.pendingRegionPoints);
  const closeRoomRegion = useRoomPlannerStore((state) => state.closeRoomRegion);
  const cancelRoomRegion = useRoomPlannerStore((state) => state.cancelRoomRegion);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canCloseRoom = mode === 'walls' && room.walls.length >= 3 && !room.isClosed();
  const canCloseRegion = mode === 'rooms' && pendingRegionPoints.length >= 3;
  const selectedToolClassName = 'bg-primary text-primary-foreground shadow-sm';
  const activeTriggerClassName =
    'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm';

  const handleExport = () => {
    const project = exportProject();
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `room-plan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabsValue = mode === 'doors' || mode === 'windows' ? 'openings' : mode;

  return (
    <div className="flex items-center gap-2 p-4 border-b border-border bg-background">
      <Tabs
        value={tabsValue}
        onValueChange={(value) => {
          if (value === 'openings') {
            setMode('doors');
            return;
          }
          setMode(value as ProjectMode);
        }}
      >
        <TabsList>
          <TabsTrigger
            value="walls"
            className={`${activeTriggerClassName} ${mode === 'walls' ? selectedToolClassName : 'text-foreground hover:text-primary'}`}
          >
            <Square className="size-4" />
            {t('admin.roomPlanner.walls')}
          </TabsTrigger>
          <TabsTrigger
            value="openings"
            className={`${activeTriggerClassName} ${
              mode === 'doors' || mode === 'windows' ? selectedToolClassName : 'text-foreground hover:text-primary'
            }`}
          >
            <DoorOpen className="size-4" />
            {t('admin.roomPlanner.openings')}
          </TabsTrigger>
          <TabsTrigger
            value="devices"
            className={`${activeTriggerClassName} ${mode === 'devices' ? selectedToolClassName : 'text-foreground hover:text-primary'}`}
          >
            <Plug className="size-4" />
            {t('admin.roomPlanner.devices')}
          </TabsTrigger>
          <TabsTrigger
            value="select"
            className={`${activeTriggerClassName} ${mode === 'select' ? selectedToolClassName : 'text-foreground hover:text-primary'}`}
          >
            <MousePointer2 className="size-4" />
            {t('admin.roomPlanner.select')}
          </TabsTrigger>
          <TabsTrigger
            value="pan"
            className={`${activeTriggerClassName} ${mode === 'pan' ? selectedToolClassName : 'text-foreground hover:text-primary'}`}
          >
            <Hand className="size-4" />
            {t('admin.roomPlanner.pan')}
          </TabsTrigger>
          <TabsTrigger
            value="rooms"
            className={`${activeTriggerClassName} ${mode === 'rooms' ? selectedToolClassName : 'text-foreground hover:text-primary'}`}
          >
            <Home className="size-4" />
            {t('admin.roomPlanner.rooms')}
          </TabsTrigger>
        </TabsList>
      </Tabs>


      <div className="mx-2 h-6 w-px bg-border" />

      <ButtonGroup size="sm">
        <Button
          onPress={undo}
          isDisabled={!canUndo}
          isIconOnly
          variant="ghost"
          className="text-foreground hover:text-primary"
          aria-label={t('admin.roomPlanner.undo')}
        >
          ↶
        </Button>
        <Button
          onPress={redo}
          isDisabled={!canRedo}
          isIconOnly
          variant="ghost"
          className="text-foreground hover:text-primary"
          aria-label={t('admin.roomPlanner.redo')}
        >
          ↷
        </Button>
      </ButtonGroup>

      <div className="mx-2 h-6 w-px bg-border" />

      <ButtonGroup size="sm">
        <Button
          onPress={() => setZoom(Math.max(50, zoom - 10))}
          isIconOnly
          variant="ghost"
          className="text-foreground hover:text-primary"
          aria-label={`${t('admin.roomPlanner.zoom')} -`}
        >
          −
        </Button>
        <span className="px-2 text-sm text-foreground">{zoom}%</span>
        <Button
          onPress={() => setZoom(Math.min(200, zoom + 10))}
          isIconOnly
          variant="ghost"
          className="text-foreground hover:text-primary"
          aria-label={`${t('admin.roomPlanner.zoom')} +`}
        >
          +
        </Button>
      </ButtonGroup>

      <div className="flex-1" />

      <Button
        size="sm"
        variant={showGrid ? 'primary' : 'ghost'}
        className={showGrid ? '' : 'text-foreground hover:text-primary'}
        onPress={() => setShowGrid(!showGrid)}
      >
        ⊞ {t('admin.roomPlanner.grid')}
      </Button>
      <Button
        size="sm"
        variant={showMeasurements ? 'primary' : 'ghost'}
        className={showMeasurements ? '' : 'text-foreground hover:text-primary'}
        onPress={() => setShowMeasurements(!showMeasurements)}
      >
        📏 {t('admin.roomPlanner.measurements')}
      </Button>

      <div className="mx-2 h-6 w-px bg-border" />

      <ButtonGroup size="sm">
        <Button
          onPress={handleExport}
          variant="ghost"
          className="text-foreground hover:text-primary"
        >
          {t('admin.roomPlanner.export')}
        </Button>
        <Button
          onPress={reset}
          variant="danger"
        >
          {t('admin.roomPlanner.reset')}
        </Button>
      </ButtonGroup>
      
      {mode === 'walls' && pendingWallStart && (
        <>
          <div className="mx-2 h-6 w-px bg-border" />
          <Button
            size="sm"
            variant="danger"
            className="text-white"
            onPress={() => useRoomPlannerStore.getState().setPendingWallStart(null)}
          >
            ✕ {t('common.cancel')}
          </Button>
        </>
      )}
      {mode === 'rooms' && (pendingRegionPoints.length > 0 || canCloseRegion) && (
        <>
          <div className="mx-2 h-6 w-px bg-border" />
          {canCloseRegion && (
            <Button size="sm" variant="primary" onPress={closeRoomRegion}>
              {t('common.save')}
            </Button>
          )}
          <Button size="sm" variant="secondary" onPress={cancelRoomRegion}>
            {t('common.cancel')}
          </Button>
        </>
      )}
    </div>
  );
}
