'use client';

import { Line, Circle, Group } from 'react-konva';
import type { Wall, ProjectMode, Point } from '@/domain/room-planner';
import { useRoomPlannerStore } from '@/store/room-planner-store';
import { useState } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { snapPoint, GRID_SIZE } from '@/domain/room-planner/snapping';

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
  
  // State for dragging preview
  const [draggingPoint, setDraggingPoint] = useState<{ index: number; pos: Point } | null>(null);

  // Always show points if we have walls or pending start
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
        // We have a pending start, so create wall from pending start to this point
        console.log('[WallLayer.handlePointClick] Has pendingWallStart, creating wall to this point');
        addWallPoint(point);
      } else {
        // No pending start - set this existing point as the start point for a new wall
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
    
    // Find connected point to align to
    let alignTo: Point | undefined;
    
    if (pointIndex === walls.length) {
       // Last point: connect to start of last wall
       alignTo = walls[walls.length - 1].a;
    } else if (pointIndex > 0) {
       // Middle point: connect to start of previous wall
       alignTo = walls[pointIndex - 1].a;
    } else {
       // First point: connect to end of first wall
       alignTo = walls[0].b;
    }

    const snappedPos = snapPoint(rawPos, showGrid ? GRID_SIZE : 1, alignTo);
    
    // Update the circle position visually
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

    // If pointIndex < walls.length, it is the start of walls[pointIndex]
    if (index < walls.length) {
       const wall = walls[index];
       lines.push(
         <Line
           key="phantom-next"
           points={[pos.x, pos.y, wall.b.x, wall.b.y]}
           stroke="#10B981"
           strokeWidth={wall.thickness}
           opacity={0.5}
           dash={[10, 10]}
         />
       );
    }

    // If pointIndex > 0, it is the end of walls[pointIndex - 1]
    if (index > 0) {
       const prevWall = walls[index - 1];
       lines.push(
         <Line
           key="phantom-prev"
           points={[prevWall.a.x, prevWall.a.y, pos.x, pos.y]}
           stroke="#10B981"
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
            stroke={isSelected ? "#10B981" : "#4B5563"}
            strokeWidth={isSelected ? wall.thickness + 2 : wall.thickness}
            lineCap="butt"
            lineJoin="miter"
            dash={isSelected ? [5, 5] : undefined}
            listening={mode === 'select' || mode === 'doors' || mode === 'windows'}
            onClick={(e) => {
              // In select mode, select wall on click
              if (mode === 'select') {
                e.cancelBubble = true;
                e.evt.stopPropagation();
                if (wall.id) {
                  selectWall(wall.id);
                }
              }
              // In doors/windows mode, let the click pass through to stage handler
            }}
          />
        );
      })}
      {/* Show pending start point if exists */}
      {mode === 'walls' && pendingWallStart && (
        <Group key="pending-start-point">
          <Circle
            x={pendingWallStart.x}
            y={pendingWallStart.y}
            radius={8}
            fill="#10B981"
            stroke="#059669"
            strokeWidth={2}
            listening={false}
          />
        </Group>
      )}
      
      {/* Render all wall points */}
      {(mode === 'walls' || mode === 'select') &&
        walls.map((wall, index) => {
          const isFirstPoint = index === 0;
          const isLastPoint = index === walls.length - 1;
          const pointIndex = index; // Index for point a of this wall
          const nextWall = !isLastPoint ? walls[index + 1] : null;
          // Check if wall.b is different from next wall's a (for disconnected walls)
          const shouldShowPointB = isLastPoint || 
            (nextWall && (Math.abs(wall.b.x - nextWall.a.x) > 0.1 || Math.abs(wall.b.y - nextWall.a.y) > 0.1));
          
          return (
            <Group key={`point-group-${index}`}>
              {/* Point A - start of wall */}
              <Group key={`point-group-${index}-a`}>
                {/* Visible small circle */}
                <Circle
                  key={`point-${index}-a`}
                  x={wall.a.x}
                  y={wall.a.y}
                  radius={mode === 'select' ? 8 : isFirstPoint ? 8 : 5}
                  fill={
                    isFirstPoint
                      ? '#10B981' // First point is always green
                      : (selectedWallPointIndex === pointIndex)
                      ? '#10B981'
                      : '#3B82F6'
                  }
                  stroke={isFirstPoint ? '#059669' : '#1E40AF'}
                  strokeWidth={2}
                  listening={false} // Let the invisible hit area handle events
                />
                {/* Invisible hit area - larger radius */}
                <Circle
                  x={wall.a.x}
                  y={wall.a.y}
                  radius={15} // Larger hit area
                  fill="transparent"
                  draggable={mode === 'select'}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    if (mode === 'walls' && isFirstPoint && pendingWallStart && walls.length >= 2) {
                      // Close the room
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
                    // Only stop propagation if not in walls mode to allow clicks to work
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
              
              {/* Point B - end of wall (only if not connected to next wall or is last wall) */}
              {shouldShowPointB && (
                <Group key={`point-group-${index}-b`}>
                  {/* Visible small circle */}
                  <Circle
                    key={`point-${index}-b`}
                    x={wall.b.x}
                    y={wall.b.y}
                    radius={mode === 'select' ? 8 : 5}
                    fill={
                      (selectedWallPointIndex === (isLastPoint ? walls.length : index + 1))
                        ? '#10B981'
                        : '#3B82F6'
                    }
                    stroke="#1E40AF"
                    strokeWidth={2}
                    listening={false}
                  />
                  {/* Invisible hit area */}
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
                      // Only stop propagation if not in walls mode to allow clicks to work
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
