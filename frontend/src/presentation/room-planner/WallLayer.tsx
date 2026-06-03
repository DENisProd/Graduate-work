'use client';

import { Line, Circle, Group } from 'react-konva';
import type { Wall, ProjectMode, Point } from '@/domain/room-planner';
import { useRoomPlannerStore } from '@/store/room-planner-store';
import { useState } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { snapPoint, GRID_SIZE } from '@/domain/room-planner/snapping';
import { domovoyCanvas, domovoyRoomPlanner } from '@/lib/domovoy-canvas-palette';

interface WallLayerProps {
  walls: Wall[];
  mode: ProjectMode;
}

export function WallLayer({ walls, mode }: WallLayerProps) {
  const selectedWallPointIndex = useRoomPlannerStore((state) => state.selectedWallPointIndex);
  const setSelectedWallPointIndex = useRoomPlannerStore((state) => state.setSelectedWallPointIndex);
  const selectedWallId = useRoomPlannerStore((state) => state.selectedWallId);
  const selectWall = useRoomPlannerStore((state) => state.selectWall);
  const moveWallPoint = useRoomPlannerStore((state) => state.moveWallPoint);
  const addWallPoint = useRoomPlannerStore((state) => state.addWallPoint);
  const showGrid = useRoomPlannerStore((state) => state.showGrid);

  const [draggingPoint, setDraggingPoint] = useState<{ index: number; pos: Point } | null>(null);

  const pendingWallStart = useRoomPlannerStore((state) => state.pendingWallStart);
  if (walls.length === 0 && !pendingWallStart) return null;

  const handlePointClick = (
    point: { x: number; y: number },
    pointIndex: number,
    e: KonvaEventObject<MouseEvent>
  ) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    if (mode === 'select') {
      setSelectedWallPointIndex(pointIndex);
    } else if (mode === 'walls') {
      const currentPendingWallStart = useRoomPlannerStore.getState().pendingWallStart;
      console.log('[WallLayer.handlePointClick] Clicked on existing point:', point, 'pointIndex:', pointIndex, 'pendingWallStart:', currentPendingWallStart);
      if (currentPendingWallStart) {
        console.log('[WallLayer.handlePointClick] Has pendingWallStart, creating wall to this point');
        addWallPoint(point);
      } else {
        console.log('[WallLayer.handlePointClick] No pendingWallStart, setting this point as start point');
        useRoomPlannerStore.getState().setPendingWallStart(point);
      }
    }
  };

  const handlePointDragStart = (pointIndex: number, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    setDraggingPoint({
      index: pointIndex,
      pos: { x: e.target.x(), y: e.target.y() }
    });
  };

  const handlePointDragMove = (pointIndex: number, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();

    const rawPos = { x: e.target.x(), y: e.target.y() };

    let alignTo: Point | undefined;

    if (pointIndex === walls.length) {
       alignTo = walls[walls.length - 1].a;
    } else if (pointIndex > 0) {
       alignTo = walls[pointIndex - 1].a;
    } else {
       alignTo = walls[0].b;
    }

    const snappedPos = snapPoint(rawPos, showGrid ? GRID_SIZE : 1, alignTo);

    e.target.x(snappedPos.x);
    e.target.y(snappedPos.y);

    setDraggingPoint({ index: pointIndex, pos: snappedPos });
  };

  const handlePointDragEnd = (pointIndex: number, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    moveWallPoint(pointIndex, newPosition);
    setDraggingPoint(null);
  };

  const renderPhantomLines = () => {
    if (!draggingPoint) return null;
    const { index, pos } = draggingPoint;
    const lines = [];

    if (index < walls.length) {
       const wall = walls[index];
       lines.push(
         <Line
           key="phantom-next"
           points={[pos.x, pos.y, wall.b.x, wall.b.y]}
           stroke={domovoyCanvas.tealBright}
           strokeWidth={wall.thickness}
           opacity={0.5}
           dash={[10, 10]}
         />
       );
    }

    if (index > 0) {
       const prevWall = walls[index - 1];
       lines.push(
         <Line
           key="phantom-prev"
           points={[prevWall.a.x, prevWall.a.y, pos.x, pos.y]}
           stroke={domovoyCanvas.tealBright}
           strokeWidth={prevWall.thickness}
           opacity={0.5}
           dash={[10, 10]}
         />
       );
    }

    return <Group listening={false}>{lines}</Group>;
  };

  return (
    <>
      {renderPhantomLines()}
      {walls.map((wall, index) => {
        const isSelected = selectedWallId === wall.id;
        return (
          <Line
            key={`wall-${index}`}
            points={[wall.a.x, wall.a.y, wall.b.x, wall.b.y]}
            stroke={isSelected ? domovoyCanvas.selection : domovoyRoomPlanner.wallNeutral}
            strokeWidth={isSelected ? wall.thickness + 2 : wall.thickness}
            lineCap="butt"
            lineJoin="miter"
            dash={isSelected ? [5, 5] : undefined}
            listening={mode === 'select' || mode === 'doors' || mode === 'windows'}
            onClick={(e) => {
              if (mode === 'select') {
                e.cancelBubble = true;
                e.evt.stopPropagation();
                if (wall.id) {
                  selectWall(wall.id);
                }
              }
            }}
          />
        );
      })}
      {mode === 'walls' && pendingWallStart && (
        <Group key="pending-start-point">
          <Circle
            x={pendingWallStart.x}
            y={pendingWallStart.y}
            radius={8}
            fill={domovoyCanvas.handle}
            stroke={domovoyCanvas.handleHover}
            strokeWidth={2}
            listening={false}
          />
        </Group>
      )}

      {(mode === 'walls' || mode === 'select') &&
        walls.map((wall, index) => {
          const isFirstPoint = index === 0;
          const isLastPoint = index === walls.length - 1;
          const pointIndex = index;
          const nextWall = !isLastPoint ? walls[index + 1] : null;
          const shouldShowPointB = isLastPoint ||
            (nextWall && (Math.abs(wall.b.x - nextWall.a.x) > 0.1 || Math.abs(wall.b.y - nextWall.a.y) > 0.1));

          return (
            <Group key={`point-group-${index}`}>
              <Group key={`point-group-${index}-a`}>
                <Circle
                  key={`point-${index}-a`}
                  x={wall.a.x}
                  y={wall.a.y}
                  radius={mode === 'select' ? 8 : isFirstPoint ? 8 : 5}
                  fill={
                    isFirstPoint
                      ? domovoyCanvas.handle
                      : selectedWallPointIndex === pointIndex
                        ? domovoyCanvas.handle
                        : domovoyCanvas.primaryMid
                  }
                  stroke={isFirstPoint ? domovoyCanvas.handleHover : domovoyCanvas.primary}
                  strokeWidth={2}
                  listening={false}
                />
                <Circle
                  x={wall.a.x}
                  y={wall.a.y}
                  radius={15}
                  fill="transparent"
                  draggable={mode === 'select'}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    if (mode === 'walls' && isFirstPoint && pendingWallStart && walls.length >= 2) {
                      useRoomPlannerStore.getState().closeRoom();
                      useRoomPlannerStore.getState().setPendingWallStart(null);
                    } else {
                      handlePointClick(wall.a, pointIndex, e);
                    }
                  }}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handlePointDragStart(pointIndex, e);
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handlePointDragMove(pointIndex, e);
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handlePointDragEnd(pointIndex, e);
                  }}
                  onMouseDown={(e) => {
                    if (mode !== 'walls') {
                      e.cancelBubble = true;
                      e.evt.stopPropagation();
                    }
                  }}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage && (mode === 'walls' || mode === 'select')) {
                      stage.container().style.cursor = 'pointer';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = mode === 'select' ? 'move' : mode === 'walls' ? 'crosshair' : 'default';
                    }
                  }}
                />
              </Group>

              {shouldShowPointB && (
                <Group key={`point-group-${index}-b`}>
                  <Circle
                    key={`point-${index}-b`}
                    x={wall.b.x}
                    y={wall.b.y}
                    radius={mode === 'select' ? 8 : 5}
                    fill={
                      selectedWallPointIndex === (isLastPoint ? walls.length : index + 1)
                        ? domovoyCanvas.handle
                        : domovoyCanvas.primaryMid
                    }
                    stroke={domovoyCanvas.primary}
                    strokeWidth={2}
                    listening={false}
                  />
                  <Circle
                    x={wall.b.x}
                    y={wall.b.y}
                    radius={15}
                    fill="transparent"
                    draggable={mode === 'select'}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      e.evt.stopPropagation();
                      const pointIndex = isLastPoint ? walls.length : index + 1;
                      handlePointClick(wall.b, pointIndex, e);
                    }}
                    onDragStart={(e) => {
                      e.cancelBubble = true;
                      e.evt.stopPropagation();
                      const pointIndex = isLastPoint ? walls.length : index + 1;
                      handlePointDragStart(pointIndex, e);
                    }}
                    onDragMove={(e) => {
                      e.cancelBubble = true;
                      e.evt.stopPropagation();
                      const pointIndex = isLastPoint ? walls.length : index + 1;
                      handlePointDragMove(pointIndex, e);
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      e.evt.stopPropagation();
                      const pointIndex = isLastPoint ? walls.length : index + 1;
                      handlePointDragEnd(pointIndex, e);
                    }}
                    onMouseDown={(e) => {
                      if (mode !== 'walls') {
                        e.cancelBubble = true;
                        e.evt.stopPropagation();
                      }
                    }}
                    onMouseEnter={(e) => {
                      const stage = e.target.getStage();
                      if (stage && (mode === 'walls' || mode === 'select')) {
                        stage.container().style.cursor = 'pointer';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const stage = e.target.getStage();
                      if (stage) {
                        stage.container().style.cursor = mode === 'select' ? 'move' : mode === 'walls' ? 'crosshair' : 'default';
                      }
                    }}
                  />
                </Group>
              )}
            </Group>
          );
        })}

    </>
  );
}
