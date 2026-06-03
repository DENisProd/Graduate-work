'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AdminSelect } from '@/components/shared/AdminSelect';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks';
import { useRoomPlannerStore } from '@/store/room-planner-store';
import { isValidOpeningPosition } from '@/domain/room-planner/snapping';
import { houseRoomsApi } from '@/lib/api-client';
import type { HouseRoomResponse } from '@/types/api';

const REGION_FILLS = [
  'rgba(59, 130, 246, 0.2)',
  'rgba(34, 197, 94, 0.2)',
  'rgba(234, 179, 8, 0.2)',
  'rgba(249, 115, 22, 0.2)',
  'rgba(168, 85, 247, 0.2)',
  'rgba(236, 72, 153, 0.2)',
];

function getRegionFill(index: number): string {
  return REGION_FILLS[index % REGION_FILLS.length];
}

export function PropertyPanel() {
  const { t } = useTranslation();
  const selectedDeviceId = useRoomPlannerStore((state) => state.selectedDeviceId);
  const selectedDoorId = useRoomPlannerStore((state) => state.selectedDoorId);
  const selectedWindowId = useRoomPlannerStore((state) => state.selectedWindowId);
  const selectedWallId = useRoomPlannerStore((state) => state.selectedWallId);
  const room = useRoomPlannerStore((state) => state.room);
  const houseId = useRoomPlannerStore((state) => state.houseId);
  const roomRegions = useRoomPlannerStore((state) => state.roomRegions);
  const pendingRegionPoints = useRoomPlannerStore((state) => state.pendingRegionPoints);
  const selectedRegionId = useRoomPlannerStore((state) => state.selectedRegionId);
  const selectedRegionPointIndex = useRoomPlannerStore((state) => state.selectedRegionPointIndex);
  const setRegionAssignment = useRoomPlannerStore((state) => state.setRegionAssignment);
  const removeRoomRegion = useRoomPlannerStore((state) => state.removeRoomRegion);
  const removeRegionPoint = useRoomPlannerStore((state) => state.removeRegionPoint);
  const setSelectedRegionPointIndex = useRoomPlannerStore((state) => state.setSelectedRegionPointIndex);
  const closeRoomRegion = useRoomPlannerStore((state) => state.closeRoomRegion);
  const cancelRoomRegion = useRoomPlannerStore((state) => state.cancelRoomRegion);
  const removeDevice = useRoomPlannerStore((state) => state.removeDevice);
  const updateDoor = useRoomPlannerStore((state) => state.updateDoor);
  const updateWindow = useRoomPlannerStore((state) => state.updateWindow);
  const removeDoor = useRoomPlannerStore((state) => state.removeDoor);
  const removeWindow = useRoomPlannerStore((state) => state.removeWindow);
  const removeWall = useRoomPlannerStore((state) => state.removeWall);

  const [houseRooms, setHouseRooms] = useState<HouseRoomResponse[]>([]);
  useEffect(() => {
    if (!houseId) return;
    houseRoomsApi
      .getByHouseId(houseId)
      .then((data) => setHouseRooms(Array.isArray(data) ? data : []))
      .catch(() => setHouseRooms([]));
  }, [houseId]);

  const isValidWidth = (opening: { wallId: string; position: number; width: number; id: string }, newWidth: number, isDoor: boolean): boolean => {
    const wall = room.walls.find(w => w.id === opening.wallId);
    if (!wall) return false;

    if (!isValidOpeningPosition(
      wall,
      opening.position,
      newWidth,
      room.walls.map(w => ({ ...w, id: w.id || '' })),
      wall.id || ''
    )) {
      return false;
    }

    const wallLength = Math.sqrt(
      Math.pow(wall.b.x - wall.a.x, 2) + Math.pow(wall.b.y - wall.a.y, 2)
    );
    const halfWidth = newWidth / 2;
    const centerDist = opening.position * wallLength;
    const newStart = centerDist - halfWidth;
    const newEnd = centerDist + halfWidth;

    for (const door of room.doors) {
      if (door.id === opening.id) continue;

      if (door.wallId !== opening.wallId) continue;

      const doorHalfWidth = door.width / 2;
      const doorCenterDist = door.position * wallLength;
      const doorStart = doorCenterDist - doorHalfWidth;
      const doorEnd = doorCenterDist + doorHalfWidth;

      if (!(newEnd <= doorStart || newStart >= doorEnd)) {
        return false;
      }
    }

    for (const window of room.windows) {
      if (window.id === opening.id) continue;
      if (window.wallId !== opening.wallId) continue;

      const windowHalfWidth = window.width / 2;
      const windowCenterDist = window.position * wallLength;
      const windowStart = windowCenterDist - windowHalfWidth;
      const windowEnd = windowCenterDist + windowHalfWidth;

      if (!(newEnd <= windowStart || newStart >= windowEnd)) {
        return false;
      }
    }

    return true;
  };

  const selectedDevice = selectedDeviceId
    ? room.devices.find((d) => d.id === selectedDeviceId)
    : null;
  const selectedDoor = selectedDoorId
    ? room.doors.find((d) => d.id === selectedDoorId)
    : null;
  const selectedWindow = selectedWindowId
    ? room.windows.find((w) => w.id === selectedWindowId)
    : null;
  const selectedWall = selectedWallId
    ? room.walls.find((w) => w.id === selectedWallId)
    : null;

  const selectedRegion = selectedRegionId
    ? roomRegions.find((r) => r.id === selectedRegionId)
    : null;

  if (!selectedDevice && !selectedDoor && !selectedWindow && !selectedWall) {
    const roomOptions = [
      { id: '', text: `— ${t('admin.roomPlanner.unassigned')}` },
      ...houseRooms.map((r) => ({ id: String(r.id), text: r.name ?? r.externalId ?? '' })),
    ];
    const drawingRegion = pendingRegionPoints.length > 0;
    const canCloseRegion = pendingRegionPoints.length >= 3;

    return (
      <Card className="w-64 h-full bg-transparent shadow-none border-none flex flex-col min-h-0">
        <Card.Header className="p-0 pb-2">
          <Card.Title className="text-lg font-semibold">{t('admin.roomPlanner.properties')}</Card.Title>
        </Card.Header>
        <Card.Content className="p-0 flex flex-col gap-4 min-h-0 overflow-auto">
          {drawingRegion ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t('admin.roomPlanner.regionDrawingHint')}
              </p>
              {canCloseRegion && (
                <Button size="sm" variant="primary" onPress={closeRoomRegion} className="w-full">
                  {t('common.save')}
                </Button>
              )}
              <Button size="sm" variant="secondary" onPress={cancelRoomRegion} className="w-full">
                {t('common.cancel')}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {t('admin.roomPlanner.selectElementHint')}
              </p>
              {selectedRegionId != null && selectedRegionPointIndex != null && (() => {
                const region = roomRegions.find((r) => r.id === selectedRegionId);
                if (!region) return null;
                const canDeleteVertex = region.points.length > 3;
                return (
                  <div className="space-y-2 p-2 rounded-lg border border-border bg-muted">
                    <h3 className="text-sm font-semibold">{t('admin.roomPlanner.regionVertexTitle')}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.roomPlanner.regionVertexHint', {
                        index: selectedRegionPointIndex + 1,
                        total: region.points.length,
                      })}
                    </p>
                    {canDeleteVertex && (
                      <Button
                        size="sm"
                        variant="danger"
                        className="w-full"
                        onPress={() => {
                          removeRegionPoint(selectedRegionId, selectedRegionPointIndex);
                          setSelectedRegionPointIndex(null);
                        }}
                      >
                        {t('admin.roomPlanner.deleteVertex')}
                      </Button>
                    )}
                    {!canDeleteVertex && (
                      <p className="text-xs text-muted-foreground">
                        {t('admin.roomPlanner.minVerticesHint')}
                      </p>
                    )}
                  </div>
                );
              })()}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">{t('admin.roomPlanner.roomsMarkupTitle')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('admin.roomPlanner.roomsMarkupDescription')}
                </p>
                {selectedRegionId != null && selectedRegionPointIndex == null && (
                  <p className="text-xs text-muted-foreground">
                    {t('admin.roomPlanner.regionSideHint')}
                  </p>
                )}
                {roomRegions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t('admin.roomPlanner.noRegionsHint')}
                  </p>
                ) : (
                  roomRegions.map((region, index) => (
                    <div key={region.id} className="space-y-1 p-2 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-sm border border-border"
                            style={{ backgroundColor: getRegionFill(index) }}
                          />
                          <span className="text-xs font-medium">
                            {t('admin.roomPlanner.regionLabel', { index: index + 1 })}
                          </span>
                        </div>
                        {selectedRegionId === region.id && (
                          <span className="text-xs text-muted-foreground">
                            {t('admin.roomPlanner.selectedLower')}
                          </span>
                        )}
                      </div>
                      <AdminSelect
                        label={t('admin.accessControl.houseRoom')}
                        placeholder={t('admin.roomPlanner.unassigned')}
                        value={region.houseRoomId != null ? String(region.houseRoomId) : ''}
                        onChange={(v) =>
                          setRegionAssignment(region.id, v === '' || v == null ? null : v)
                        }
                        options={roomOptions}
                      />
                      <Button
                        size="sm"
                        variant="danger"
                        className="w-full mt-1"
                        onPress={() => removeRoomRegion(region.id)}
                      >
                        {t('admin.roomPlanner.deleteRegion')}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </Card.Content>
      </Card>
    );
  }

  const getDeviceTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      socket: t('admin.roomPlanner.socket'),
      switch: t('admin.roomPlanner.switch'),
      'motion-sensor': t('admin.roomPlanner.motionSensor'),
      'temperature-sensor': t('admin.roomPlanner.temperatureSensor'),
      camera: t('admin.roomPlanner.camera'),
      dimmer: t('admin.roomPlanner.dimmer'),
    };
    return typeMap[type] || type;
  };


  if (selectedDevice) {
    return (
      <Card className="w-64 h-full bg-transparent shadow-none border-none">
        <Card.Header className="p-0 pb-2">
          <Card.Title className="text-lg font-semibold">
            {t('admin.roomPlanner.deviceProperties')}
          </Card.Title>
        </Card.Header>
        <Card.Content className="p-0 space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('admin.roomPlanner.deviceType')}
            </label>
            <p className="text-sm">{getDeviceTypeName(selectedDevice.type)}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('admin.roomPlanner.position')}
            </label>
            <p className="text-sm">
              X: {Math.round(selectedDevice.position.x)}, Y: {Math.round(selectedDevice.position.y)}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('admin.roomPlanner.anchor')}
            </label>
            <p className="text-sm">
              {selectedDevice.anchor === 'wall'
                ? t('admin.roomPlanner.anchorWall')
                : t('admin.roomPlanner.anchorFree')}
            </p>
          </div>
          {selectedDevice.metadata && Object.keys(selectedDevice.metadata).length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('admin.roomPlanner.metadata')}
              </label>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(selectedDevice.metadata, null, 2)}
              </pre>
            </div>
          )}
          <div className="pt-2">
            <Button
              size="sm"
              variant="danger"
              className="w-full"
              onPress={() => removeDevice(selectedDevice.id)}
            >
              {t('admin.roomPlanner.deleteDevice')}
            </Button>
          </div>
        </Card.Content>
      </Card>
    );
  }


  if (selectedDoor) {

    const doorIndex = room.doors.findIndex(d => d.id === selectedDoor.id);
    const doorDisplayName =
      selectedDoor.name || t('admin.roomPlanner.doorLabel', { index: doorIndex + 1 });
    return (
      <Card className="w-64 h-full bg-transparent shadow-none border-none">
        <Card.Header className="p-0 pb-2">
          <Card.Title className="text-lg font-semibold">{doorDisplayName}</Card.Title>
        </Card.Header>
        <Card.Content className="p-0 space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t('admin.roomPlanner.name')}
            </label>
            <Input
              value={selectedDoor.name || ''}
              onChange={(e) => {
                updateDoor(selectedDoor.id, { name: e.target.value });
              }}
              placeholder={t('admin.roomPlanner.doorLabel', { index: 1 })}
              className="w-full"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">
                {t('admin.roomPlanner.width')}
              </label>
              <span className="text-xs font-semibold text-accent">
                {Math.round(selectedDoor.width)} {t('admin.roomPlanner.cm')}
              </span>
            </div>
            <div className="space-y-2">
              <Input
                type="number"
                value={selectedDoor.width.toString()}
                onChange={(e) => {
                  const width = parseFloat(e.target.value);
                  if (!isNaN(width) && width > 0) {
                    if (isValidWidth(selectedDoor, width, true)) {
                      updateDoor(selectedDoor.id, { width });
                    }
                  }
                }}
                min={20}
                max={500}
                className="w-full"
              />
              <input
                type="range"
                min={20}
                max={500}
                step={5}
                value={selectedDoor.width}
                onChange={(e) => {
                  const width = parseFloat(e.target.value);
                  if (isValidWidth(selectedDoor, width, true)) {
                    updateDoor(selectedDoor.id, { width });
                  }
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-accent"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20 {t('admin.roomPlanner.cm')}</span>
                <span>500 {t('admin.roomPlanner.cm')}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('admin.roomPlanner.dragDoorHandlesHint')}
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="sm"
              variant="danger"
              className="w-full"
              onPress={() => removeDoor(selectedDoor.id)}
            >
              {t('admin.roomPlanner.deleteDoor')}
            </Button>
          </div>
        </Card.Content>
      </Card>
    );
  }


  if (selectedWindow) {

    const windowIndex = room.windows.findIndex(w => w.id === selectedWindow.id);
    const windowDisplayName =
      selectedWindow.name || t('admin.roomPlanner.windowLabel', { index: windowIndex + 1 });
    return (
      <Card className="w-64 h-full bg-transparent shadow-none border-none">
        <Card.Header className="p-0 pb-2">
          <Card.Title className="text-lg font-semibold">{windowDisplayName}</Card.Title>
        </Card.Header>
        <Card.Content className="p-0 space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t('admin.roomPlanner.name')}
            </label>
            <Input
              value={selectedWindow.name || ''}
              onChange={(e) => {
                updateWindow(selectedWindow.id, { name: e.target.value });
              }}
              placeholder={t('admin.roomPlanner.windowLabel', { index: 1 })}
              className="w-full"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">
                {t('admin.roomPlanner.width')}
              </label>
              <span className="text-xs font-semibold text-accent">
                {Math.round(selectedWindow.width)} {t('admin.roomPlanner.cm')}
              </span>
            </div>
            <div className="space-y-2">
              <Input
                type="number"
                value={selectedWindow.width.toString()}
                onChange={(e) => {
                  const width = parseFloat(e.target.value);
                  if (!isNaN(width) && width > 0) {
                    if (isValidWidth(selectedWindow, width, false)) {
                      updateWindow(selectedWindow.id, { width });
                    }
                  }
                }}
                min={20}
                max={500}
                className="w-full"
              />
              <input
                type="range"
                min={20}
                max={500}
                step={5}
                value={selectedWindow.width}
                onChange={(e) => {
                  const width = parseFloat(e.target.value);
                  if (isValidWidth(selectedWindow, width, false)) {
                    updateWindow(selectedWindow.id, { width });
                  }
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-accent"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20 {t('admin.roomPlanner.cm')}</span>
                <span>500 {t('admin.roomPlanner.cm')}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('admin.roomPlanner.dragWindowHandlesHint')}
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="sm"
              variant="danger"
              className="w-full"
              onPress={() => removeWindow(selectedWindow.id)}
            >
              {t('admin.roomPlanner.deleteWindow')}
            </Button>
          </div>
        </Card.Content>
      </Card>
    );
  }


  if (selectedWall) {
    const wallIndex = room.walls.findIndex(w => w.id === selectedWall.id);
    const wallLength = Math.sqrt(
      Math.pow(selectedWall.b.x - selectedWall.a.x, 2) + Math.pow(selectedWall.b.y - selectedWall.a.y, 2)
    );
    
    return (
      <Card className="w-64 h-full bg-transparent shadow-none border-none">
        <Card.Header className="p-0 pb-2">
          <Card.Title className="text-lg font-semibold">
            {t('admin.roomPlanner.wallProperties')}
          </Card.Title>
        </Card.Header>
        <Card.Content className="p-0 space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t('admin.roomPlanner.length')}
            </label>
            <p className="text-sm font-semibold text-accent">
              {Math.round(wallLength)} {t('admin.roomPlanner.cm')}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t('admin.roomPlanner.thickness')}
            </label>
            <p className="text-sm">
              {selectedWall.thickness} {t('admin.roomPlanner.cm')}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t('admin.roomPlanner.pointA')}
            </label>
            <p className="text-sm text-muted-foreground">
              X: {Math.round(selectedWall.a.x)}, Y: {Math.round(selectedWall.a.y)}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t('admin.roomPlanner.pointB')}
            </label>
            <p className="text-sm text-muted-foreground">
              X: {Math.round(selectedWall.b.x)}, Y: {Math.round(selectedWall.b.y)}
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="sm"
              variant="danger"
              className="w-full"
              onPress={() => {
                if (wallIndex !== -1) {
                  removeWall(wallIndex);
                }
              }}
            >
              {t('admin.roomPlanner.deleteWall')}
            </Button>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return null;
}
