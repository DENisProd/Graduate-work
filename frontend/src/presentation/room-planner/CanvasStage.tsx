'use client';

import { Stage, Layer, Rect } from 'react-konva';
import { WallLayer } from './WallLayer';
import { DeviceLayer } from './DeviceLayer';
import { DoorWindowLayer } from './DoorWindowLayer';
import { DoorWindowPreviewLayer } from './DoorWindowPreviewLayer';
import { DevicePreviewLayer } from './DevicePreviewLayer';
import { WallPreviewLayer } from './WallPreviewLayer';
import { MeasurementLayer } from './MeasurementLayer';
import { GridLayer } from './GridLayer';
import { RegionLayer } from './RegionLayer';
import { useRoomPlannerStore } from '@/store/room-planner-store';
import { useMemo, useRef, useState, useEffect } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { snapPoint, GRID_SIZE, isValidOpeningPosition } from '@/domain/room-planner/snapping';
import type { DeviceType } from '@/domain/room-planner';
import type { Stage as KonvaStage } from 'konva/lib/Stage';

import { useTheme } from '@/hooks';

const CANVAS_WIDTH = 1920; // 16:9 aspect ratio
const CANVAS_HEIGHT = 1080;
const VIRTUAL_SIZE = 5000; // Expanded virtual canvas size

interface CanvasStageProps {
  width?: number;
  height?: number;
}

export function CanvasStage({ width, height }: CanvasStageProps) {
  const { resolvedTheme } = useTheme();
  const room = useRoomPlannerStore((state) => state.room);
  const mode = useRoomPlannerStore((state) => state.mode);
  const pendingWallStart = useRoomPlannerStore((state) => state.pendingWallStart);
  const zoom = useRoomPlannerStore((state) => state.zoom);
  const addWallPoint = useRoomPlannerStore((state) => state.addWallPoint);
  const addDevice = useRoomPlannerStore((state) => state.addDevice);
  const addDoor = useRoomPlannerStore((state) => state.addDoor);
  const addWindow = useRoomPlannerStore((state) => state.addWindow);
  const selectDoor = useRoomPlannerStore((state) => state.selectDoor);
  const selectWindow = useRoomPlannerStore((state) => state.selectWindow);
  const pendingDeviceType = useRoomPlannerStore((state) => state.pendingDeviceType);
  const setPendingDeviceType = useRoomPlannerStore((state) => state.setPendingDeviceType);
  const showMeasurements = useRoomPlannerStore((state) => state.showMeasurements);
  const showGrid = useRoomPlannerStore((state) => state.showGrid);
  const addRoomRegionPoint = useRoomPlannerStore((state) => state.addRoomRegionPoint);
  const closeRoomRegion = useRoomPlannerStore((state) => state.closeRoomRegion);
  const selectRegion = useRoomPlannerStore((state) => state.selectRegion);
  const stageRef = useRef<KonvaStage | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const [lastValidOpeningPos, setLastValidOpeningPos] = useState<{
    wallId: string;
    position: number;
    point: { x: number; y: number };
  } | null>(null);

  const stageWidth = width || CANVAS_WIDTH;
  const stageHeight = height || CANVAS_HEIGHT;
  const scale = zoom / 100;

  // Handle Escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'walls') {
          useRoomPlannerStore.getState().setPendingWallStart(null);
        } else if (mode === 'devices') {
          useRoomPlannerStore.getState().setPendingDeviceType(null);
        } else if (mode === 'rooms') {
          useRoomPlannerStore.getState().cancelRoomRegion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  const stageSize = useMemo(
    () => ({
      width: stageWidth,
      height: stageHeight,
    }),
    [stageWidth, stageHeight]
  );

  // Helper to get world coordinates from stage pointer
  const getStagePointerPosition = (stage: KonvaStage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    
    // Account for stage position (panning) and scale
    const stageX = stage.x();
    const stageY = stage.y();
    
    return {
      x: (pointer.x - stageX) / scale,
      y: (pointer.y - stageY) / scale
    };
  };

  const lastWallPoint = useMemo(() => {
    // Only use pendingWallStart - no automatic continuation from last wall point
    // User must manually select start point for each wall segment
    return pendingWallStart || null;
  }, [pendingWallStart]);

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    // Don't click if panning (dragged)
    if (stage.isDragging()) return;

    // Don't handle clicks on interactive elements (points, devices, etc.)
    const target = e.target;
    const targetName = target.name();
    // Click on region fill (разметка комнат) — выбираем область
    if (mode === 'rooms' && typeof targetName === 'string' && targetName.startsWith('region-fill-')) {
      const regionId = targetName.replace('region-fill-', '');
      selectRegion(regionId);
      e.evt.stopPropagation();
      return;
    }
    // Click on region vertex or edge — не добавлять новую точку (обрабатывается в RegionLayer)
    if (mode === 'rooms' && typeof targetName === 'string' && (targetName.startsWith('region-point-') || targetName.startsWith('region-edge-'))) {
      return;
    }
    // Use explicit name check for background or check if it's the Stage
    const isBackground = targetName === 'background';
    const isStage = target === stage;

    if (!isBackground && !isStage) {
      // Check for allowed types if not background/stage
      const targetType = target.getType(); // 'Shape', 'Group', etc.
      
      // We can also check className for more specificity if needed
      // const className = target.getClassName(); // 'Rect', 'Circle', 'Line'

      if (targetType === 'Group' || targetType === 'Text') { // 'Circle' usually means point
         return; 
      }
      
      // If it's a shape but not our background, check if it's a point (Circle)
      // Points should be handled by their own onClick handlers, not by stage
      if (target.getClassName() === 'Circle') {
        console.log('[CanvasStage.handleStageClick] Click on Circle detected, ignoring (should be handled by point handler)');
        return;
      }
      
      // In other modes, also ignore clicks on walls
      if (target.getClassName() === 'Line' && mode !== 'doors' && mode !== 'windows' && mode !== 'select' && mode !== 'walls') {
        return;
      }
    }

    // Prevent event bubbling - stop propagation to avoid double handling
    // But only after we've checked that it's not a point or other interactive element
    e.evt.stopPropagation();

    const clickPoint = getStagePointerPosition(stage);
    if (!clickPoint) return;
    
    const { x, y } = clickPoint;
    
    // Bounds Check
    if (x < 0 || x > VIRTUAL_SIZE || y < 0 || y > VIRTUAL_SIZE) {
       return;
    }

    if (mode === 'rooms') {
      const snapped = showGrid ? snapPoint(clickPoint, GRID_SIZE, undefined) : clickPoint;
      const pending = useRoomPlannerStore.getState().pendingRegionPoints;
      if (pending.length >= 3) {
        const first = pending[0];
        const dist = Math.sqrt(Math.pow(snapped.x - first.x, 2) + Math.pow(snapped.y - first.y, 2));
        if (dist < 20) {
          closeRoomRegion();
          return;
        }
      }
      addRoomRegionPoint(snapped);
      return;
    }

    if (mode === 'walls') {
      // Remove arbitrary limit of 12 vertices
      // if (room.walls.length >= 12) return;
      
      // Get current state to avoid stale closure
      const currentState = useRoomPlannerStore.getState();
      const currentPendingWallStart = currentState.pendingWallStart;
      
      console.log('[CanvasStage.handleStageClick] Walls mode click, pendingWallStart:', currentPendingWallStart, 'clickPoint:', clickPoint);
      
      // Only snap to pendingWallStart if it exists, otherwise snap to grid only
      const snapReference = currentPendingWallStart || undefined;
      const snappedPoint = snapPoint(clickPoint, showGrid ? GRID_SIZE : 1, snapReference);
      console.log('[CanvasStage.handleStageClick] Snapped point:', snappedPoint);

      // Check if clicking on first point to close the room
      if (currentPendingWallStart && room.walls.length >= 2) {
        const firstPoint = room.walls[0].a;
        const distance = Math.sqrt(
          Math.pow(snappedPoint.x - firstPoint.x, 2) + Math.pow(snappedPoint.y - firstPoint.y, 2)
        );
        // If clicking near first point (within 20px), close the room
        if (distance < 20) {
          console.log('[CanvasStage.handleStageClick] Closing room');
          useRoomPlannerStore.getState().closeRoom();
          useRoomPlannerStore.getState().setPendingWallStart(null);
          return;
        }
      }
      
      // When clicking on empty space, always use the snapped point
      // This allows creating walls from pendingWallStart to new points
      console.log('[CanvasStage.handleStageClick] Calling addWallPoint with snappedPoint');
      addWallPoint(snappedPoint);
    } else if (mode === 'select') {
      // In select mode, clicking on background deselects everything
      if (isBackground || isStage) {
        const { selectWall, selectDevice } = useRoomPlannerStore.getState();
        selectDoor(null);
        selectWindow(null);
        selectDevice(null);
        selectWall(null);
      }
    } else if (mode === 'devices' && pendingDeviceType) {
      // Add device on click
      const anchor: 'wall' | 'free' = room.walls.length > 0 ? 'wall' : 'free';
      addDevice(pendingDeviceType, { x, y }, anchor);
      setPendingDeviceType(null);
    } else if (mode === 'doors' || mode === 'windows') {
      // Use last valid position if available and current position is invalid or user just clicked
      // But we need to check if the current click is close enough to the wall to be considered an attempt
      
      // Calculate closest wall logic again for click validation
      let closestWall: typeof room.walls[0] | null = null;
      let closestDistance = Infinity;
      let closestPosition = 0;

      for (const wall of room.walls) {
        const wallLength = Math.sqrt(
          Math.pow(wall.b.x - wall.a.x, 2) + Math.pow(wall.b.y - wall.a.y, 2)
        );
        if (wallLength === 0) continue;

        const dx = wall.b.x - wall.a.x;
        const dy = wall.b.y - wall.a.y;
        const t = Math.max(0, Math.min(1, ((x - wall.a.x) * dx + (y - wall.a.y) * dy) / (wallLength * wallLength)));
        const projX = wall.a.x + t * dx;
        const projY = wall.a.y + t * dy;
        const distance = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));

        if (distance < closestDistance && distance < 80) {
          closestDistance = distance;
          closestWall = wall;
          closestPosition = t;
        }
      }

      // Check validity of CURRENT click position
      let isValidCurrent = false;
      if (closestWall) {
        isValidCurrent = isValidOpeningPosition(
          closestWall,
          closestPosition,
          mode === 'doors' ? 80 : 100,
          room.walls.map(w => ({ ...w, id: w.id || '' })),
          closestWall.id || ''
        );
      }

      // Determine final placement data
      let finalWallId = closestWall?.id;
      let finalPosition = closestPosition;

      // If current is invalid but we have a last valid position, use that
      if (!isValidCurrent && lastValidOpeningPos) {
        finalWallId = lastValidOpeningPos.wallId;
        finalPosition = lastValidOpeningPos.position;
      } else if (!isValidCurrent && !lastValidOpeningPos) {
        // Cannot place anywhere - deselect if clicking on background
        if (isBackground || isStage) {
          selectDoor(null);
          selectWindow(null);
        }
        return;
      }

      if (finalWallId) {
        if (mode === 'doors') {
          // Generate friendly name
          const doorCount = room.doors.length + 1;
          addDoor({
            id: `door_${Date.now()}_${Math.random()}`,
            wallId: finalWallId,
            position: finalPosition,
            width: 80,
            direction: 'left',
            name: `Дверь #${doorCount}`,
          });
        } else if (mode === 'windows') {
          // Generate friendly name
          const windowCount = room.windows.length + 1;
          addWindow({
            id: `window_${Date.now()}_${Math.random()}`,
            wallId: finalWallId,
            position: finalPosition,
            width: 100,
            name: `Окно #${windowCount}`,
          });
        }
      }
    }
  };

  const handleStageDrop = (e: KonvaEventObject<DragEvent>) => {
    // Allow dropping even if mode is not devices (switch implicitly or just add)
    // if (mode !== 'devices') return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = getStagePointerPosition(stage);
    if (!pointerPos) return;

    // Get device type from drag data
    const deviceType = e.evt.dataTransfer?.getData('device-type') as DeviceType | undefined;
    if (!deviceType) return;

    // Convert to canvas coordinates
    const { x, y } = pointerPos;

    // Bounds Check
    if (x < 0 || x > VIRTUAL_SIZE || y < 0 || y > VIRTUAL_SIZE) {
       return;
    }

    // Determine anchor based on proximity to walls
    const anchor: 'wall' | 'free' = room.walls.length > 0 ? 'wall' : 'free';

    addDevice(deviceType, { x, y }, anchor);
    setPendingDeviceType(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        draggable={mode === 'pan'}
        style={{ cursor: mode === 'pan' ? 'grab' : mode === 'walls' || mode === 'rooms' ? 'crosshair' : mode === 'select' ? 'move' : 'default' }}
        onClick={handleStageClick}
        onDrop={handleStageDrop}
        onDragStart={() => {
           if (mode === 'pan') {
             if (stageRef.current) {
               stageRef.current.container().style.cursor = 'grabbing';
             }
           }
        }}
        onDragEnd={() => {
           if (mode === 'pan') {
             if (stageRef.current) {
               stageRef.current.container().style.cursor = 'grab';
             }
           }
        }}
        onDragOver={(e: KonvaEventObject<DragEvent>) => {
          e.evt.preventDefault();
          // Track mouse position during drag for phantom preview
          const stage = e.target.getStage();
          if (stage) {
            const pos = getStagePointerPosition(stage);
            if (pos) {
              setMousePosition(pos);
            }
          }
        }}
        onMouseMove={(e: KonvaEventObject<MouseEvent>) => {
          // Track mouse position for previews
          // We need this for walls, doors, and windows
          const stage = e.target.getStage();
          if (stage) {
            const pos = getStagePointerPosition(stage);
            if (pos) {
              setMousePosition(pos);
              
              // Track last valid opening position
              if (mode === 'doors' || mode === 'windows') {
                 let closestWall: typeof room.walls[0] | null = null;
                 let closestDistance = Infinity;
                 let closestPosition = 0;
           
                 for (const wall of room.walls) {
                   const wallLength = Math.sqrt(
                     Math.pow(wall.b.x - wall.a.x, 2) + Math.pow(wall.b.y - wall.a.y, 2)
                   );
                   if (wallLength === 0) continue;
           
                   const dx = wall.b.x - wall.a.x;
                   const dy = wall.b.y - wall.a.y;
                   const t = Math.max(0, Math.min(1, ((pos.x - wall.a.x) * dx + (pos.y - wall.a.y) * dy) / (wallLength * wallLength)));
                   const projX = wall.a.x + t * dx;
                   const projY = wall.a.y + t * dy;
                   const distance = Math.sqrt(Math.pow(pos.x - projX, 2) + Math.pow(pos.y - projY, 2));
           
                   if (distance < closestDistance && distance < 80) {
                     closestDistance = distance;
                     closestWall = wall;
                     closestPosition = t;
                   }
                 }
                 
                 if (closestWall) {
                    const isValid = isValidOpeningPosition(
                      closestWall,
                      closestPosition,
                      mode === 'doors' ? 80 : 100,
                      room.walls.map(w => ({ ...w, id: w.id || '' })),
                      closestWall.id || ''
                    );
                   
                   if (isValid) {
                     const dx = closestWall.b.x - closestWall.a.x;
                     const dy = closestWall.b.y - closestWall.a.y;
                     setLastValidOpeningPos({
                       wallId: closestWall.id || '',
                       position: closestPosition,
                       point: {
                         x: closestWall.a.x + closestPosition * dx,
                         y: closestWall.a.y + closestPosition * dy
                       }
                     });
                   }
                 }
              }
            }
          }
        }}
        onMouseLeave={() => {
          setMousePosition(null);
        }}
      >
        <Layer>
          {/* Virtual Canvas Background */}
          <Rect
            name="background"
            x={0}
            y={0}
            width={VIRTUAL_SIZE}
            height={VIRTUAL_SIZE}
            fill={resolvedTheme === 'dark' ? '#1f2937' : '#ffffff'} // gray-800 for dark, white for light
            shadowColor="black"
            shadowBlur={10}
            shadowOpacity={0.1}
            listening={true}
            // onClick removed - Stage handles all clicks to prevent double handling
          />
          {/* Bounds Indicator */}
          <Rect
            x={0}
            y={0}
            width={VIRTUAL_SIZE}
            height={VIRTUAL_SIZE}
            stroke="#ef4444"
            strokeWidth={2}
            dash={[10, 10]}
            listening={false}
            opacity={0.5}
          />
          
          <GridLayer width={VIRTUAL_SIZE} height={VIRTUAL_SIZE} show={showGrid} />
          <WallLayer walls={room.walls} mode={mode} />
          <MeasurementLayer walls={room.walls} show={showMeasurements} />
          <DoorWindowLayer
            walls={room.walls}
            doors={room.doors}
            windows={room.windows}
            mode={mode}
          />
          <WallPreviewLayer
             mode={mode}
             mousePosition={mousePosition}
             lastWallPoint={lastWallPoint}
             selectedWallPoint={null}
             selectedWallPointIndex={null}
             walls={room.walls}
             showGrid={showGrid}
             pendingWallStart={pendingWallStart}
           />
          <DoorWindowPreviewLayer
            walls={room.walls}
            mode={mode}
            mousePosition={mousePosition}
            lastValidPosition={lastValidOpeningPos}
          />
          <DevicePreviewLayer
            type={pendingDeviceType}
            mousePosition={mousePosition}
          />
          <DeviceLayer devices={room.devices} mode={mode} />
        </Layer>
        <Layer>
          <RegionLayer />
        </Layer>
      </Stage>
    </div>
  );
}
