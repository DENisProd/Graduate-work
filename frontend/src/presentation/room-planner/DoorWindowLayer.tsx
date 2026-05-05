'use client';

import { Line, Group, Rect, Text, Circle } from 'react-konva';
import type { Door, Window, Wall, ProjectMode } from '@/domain/room-planner';
import { useRoomPlannerStore } from '@/store/room-planner-store';
import { useState, useRef } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Group as KonvaGroup } from 'konva/lib/Group';
import type { Shape as KonvaShape } from 'konva/lib/Shape';
import { isValidOpeningPosition } from '@/domain/room-planner/snapping';
import { domovoyCanvas } from '@/lib/domovoy-canvas-palette';

interface DoorWindowLayerProps {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  mode: ProjectMode;
}

export function DoorWindowLayer({ walls, doors, windows, mode }: DoorWindowLayerProps) {
  const removeDoor = useRoomPlannerStore((state) => state.removeDoor);
  const removeWindow = useRoomPlannerStore((state) => state.removeWindow);
  const selectDoor = useRoomPlannerStore((state) => state.selectDoor);
  const selectWindow = useRoomPlannerStore((state) => state.selectWindow);
  const selectedDoorId = useRoomPlannerStore((state) => state.selectedDoorId);
  const selectedWindowId = useRoomPlannerStore((state) => state.selectedWindowId);
  const updateDoor = useRoomPlannerStore((state) => state.updateDoor);
  const updateWindow = useRoomPlannerStore((state) => state.updateWindow);
  const room = useRoomPlannerStore((state) => state.room);
  
  const [resizingDoor, setResizingDoor] = useState<{ id: string; initialWidth: number; initialCenter: { x: number; y: number }; angle: number; initialHandleDistance: number; handle: 'left' | 'right' } | null>(null);
  const [resizingWindow, setResizingWindow] = useState<{ id: string; initialWidth: number; initialCenter: { x: number; y: number }; angle: number; initialHandleDistance: number; handle: 'left' | 'right' } | null>(null);
  const [draggingDoor, setDraggingDoor] = useState<{ id: string; initialPosition: number; wallId: string; lastValidPosition: number } | null>(null);
  const [draggingWindow, setDraggingWindow] = useState<{ id: string; initialPosition: number; wallId: string; lastValidPosition: number } | null>(null);
  
  // Refs to store group references for dragBoundFunc
  const doorGroupRefs = useRef<Map<string, KonvaGroup>>(new Map());
  const windowGroupRefs = useRef<Map<string, KonvaGroup>>(new Map());

  // Helper function to check if opening width is valid
  const isValidWidth = (opening: { wallId: string; position: number; width: number; id: string }, newWidth: number): boolean => {
    const wall = walls.find(w => w.id === opening.wallId);
    if (!wall) return false;

    // Check if new width fits on the wall
    if (!isValidOpeningPosition(
      wall,
      opening.position,
      newWidth,
      walls.map(w => ({ ...w, id: w.id || '' })),
      wall.id || ''
    )) {
      return false;
    }

    // Check for overlaps with other openings on the same wall
    const wallLength = Math.sqrt(
      Math.pow(wall.b.x - wall.a.x, 2) + Math.pow(wall.b.y - wall.a.y, 2)
    );
    const halfWidth = newWidth / 2;
    const centerDist = opening.position * wallLength;
    const newStart = centerDist - halfWidth;
    const newEnd = centerDist + halfWidth;

    // Check doors on the same wall (use room.doors to get current state)
    for (const door of room.doors) {
      if (door.id === opening.id) continue; // Skip self
      if (door.wallId !== opening.wallId) continue;

      const doorHalfWidth = door.width / 2;
      const doorCenterDist = door.position * wallLength;
      const doorStart = doorCenterDist - doorHalfWidth;
      const doorEnd = doorCenterDist + doorHalfWidth;

      // Check if intervals overlap
      if (!(newEnd <= doorStart || newStart >= doorEnd)) {
        return false;
      }
    }

    // Check windows on the same wall (use room.windows to get current state)
    for (const window of room.windows) {
      if (window.id === opening.id) continue; // Skip self
      if (window.wallId !== opening.wallId) continue;

      const windowHalfWidth = window.width / 2;
      const windowCenterDist = window.position * wallLength;
      const windowStart = windowCenterDist - windowHalfWidth;
      const windowEnd = windowCenterDist + windowHalfWidth;

      // Check if intervals overlap
      if (!(newEnd <= windowStart || newStart >= windowEnd)) {
        return false;
      }
    }

    return true;
  };

  const getWallById = (wallId: string): Wall | undefined => {
    return walls.find((w) => w.id === wallId);
  };

  const getPointOnWall = (wall: Wall, position: number): { x: number; y: number } => {
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    return {
      x: wall.a.x + dx * position,
      y: wall.a.y + dy * position,
    };
  };

  const handleDoorResizeStart = (door: Door, wall: Wall, handle: 'left' | 'right', e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    const center = getPointOnWall(wall, door.position);
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    
    // Calculate initial handle position relative to center
    const doorHalfWidth = door.width / 2;
    const initialHandleDistance = handle === 'left' ? -doorHalfWidth : doorHalfWidth;
    
    setResizingDoor({ 
      id: door.id, 
      initialWidth: door.width, 
      initialCenter: center, 
      angle: Math.atan2(dy, dx),
      initialHandleDistance: initialHandleDistance,
      handle: handle
    });
  };

  const handleDoorResizeMove = (door: Door, wall: Wall, handle: 'left' | 'right', e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    if (!resizingDoor || resizingDoor.id !== door.id) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Transform pointer position to world coordinates
    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    const worldX = (pointerPos.x - stageX) / scale;
    const worldY = (pointerPos.y - stageY) / scale;

    // Calculate wall direction
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    if (wallLength === 0) return;
    
    const wallDirX = dx / wallLength;
    const wallDirY = dy / wallLength;
    const center = resizingDoor.initialCenter;

    // Project pointer position onto wall line
    const relX = worldX - center.x;
    const relY = worldY - center.y;
    const currentHandleDistance = relX * wallDirX + relY * wallDirY;

    // Calculate new width: distance from left handle to right handle
    // Left handle is at -doorHalfWidth, right handle is at +doorHalfWidth
    // When dragging left handle, new left position = currentHandleDistance
    // When dragging right handle, new right position = currentHandleDistance
    let newWidth: number;
    const initialHalfWidth = resizingDoor.initialWidth / 2;
    if (handle === 'left') {
      // Left handle: new width = distance from new left position to right handle (which stays at +initialHalfWidth)
      newWidth = 2 * (initialHalfWidth - currentHandleDistance);
    } else {
      // Right handle: new width = distance from left handle (which stays at -initialHalfWidth) to new right position
      newWidth = 2 * (currentHandleDistance - (-initialHalfWidth));
    }

    // Clamp to valid range
    newWidth = Math.max(20, Math.min(500, newWidth));

    // Validate width before updating
    if (isValidWidth(door, newWidth)) {
      updateDoor(door.id, { width: newWidth });
    }
  };

  const handleDoorResizeEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    setResizingDoor(null);
  };

  const handleWindowResizeStart = (window: Window, wall: Wall, handle: 'left' | 'right', e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    const center = getPointOnWall(wall, window.position);
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    
    // Calculate initial handle position relative to center
    const windowHalfWidth = window.width / 2;
    const initialHandleDistance = handle === 'left' ? -windowHalfWidth : windowHalfWidth;
    
    setResizingWindow({ 
      id: window.id, 
      initialWidth: window.width, 
      initialCenter: center, 
      angle: Math.atan2(dy, dx),
      initialHandleDistance: initialHandleDistance,
      handle: handle
    });
  };

  const handleWindowResizeMove = (window: Window, wall: Wall, handle: 'left' | 'right', e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    if (!resizingWindow || resizingWindow.id !== window.id) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Transform pointer position to world coordinates
    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    const worldX = (pointerPos.x - stageX) / scale;
    const worldY = (pointerPos.y - stageY) / scale;

    // Calculate wall direction
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    if (wallLength === 0) return;
    
    const wallDirX = dx / wallLength;
    const wallDirY = dy / wallLength;
    const center = resizingWindow.initialCenter;

    // Project pointer position onto wall line
    const relX = worldX - center.x;
    const relY = worldY - center.y;
    const currentHandleDistance = relX * wallDirX + relY * wallDirY;

    // Calculate new width: distance from left handle to right handle
    // Left handle is at -windowHalfWidth, right handle is at +windowHalfWidth
    // When dragging left handle, new left position = currentHandleDistance
    // When dragging right handle, new right position = currentHandleDistance
    let newWidth: number;
    const initialHalfWidth = resizingWindow.initialWidth / 2;
    if (handle === 'left') {
      // Left handle: new width = distance from new left position to right handle (which stays at +initialHalfWidth)
      newWidth = 2 * (initialHalfWidth - currentHandleDistance);
    } else {
      // Right handle: new width = distance from left handle (which stays at -initialHalfWidth) to new right position
      newWidth = 2 * (currentHandleDistance - (-initialHalfWidth));
    }

    // Clamp to valid range
    newWidth = Math.max(20, Math.min(500, newWidth));

    // Validate width before updating
    if (isValidWidth(window, newWidth)) {
      updateWindow(window.id, { width: newWidth });
    }
  };

  const handleWindowResizeEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    setResizingWindow(null);
  };

  // Helper function to check if opening position is valid
  const isValidPosition = (opening: { wallId: string; position: number; width: number; id: string }, newPosition: number): boolean => {
    const wall = walls.find(w => w.id === opening.wallId);
    if (!wall) return false;

    // Check if new position fits on the wall
    if (!isValidOpeningPosition(
      wall,
      newPosition,
      opening.width,
      walls.map(w => ({ ...w, id: w.id || '' })),
      wall.id || ''
    )) {
      return false;
    }

    // Check for overlaps with other openings on the same wall
    const wallLength = Math.sqrt(
      Math.pow(wall.b.x - wall.a.x, 2) + Math.pow(wall.b.y - wall.a.y, 2)
    );
    const halfWidth = opening.width / 2;
    const centerDist = newPosition * wallLength;
    const newStart = centerDist - halfWidth;
    const newEnd = centerDist + halfWidth;

    // Check doors on the same wall
    for (const door of room.doors) {
      if (door.id === opening.id) continue; // Skip self
      if (door.wallId !== opening.wallId) continue;

      const doorHalfWidth = door.width / 2;
      const doorCenterDist = door.position * wallLength;
      const doorStart = doorCenterDist - doorHalfWidth;
      const doorEnd = doorCenterDist + doorHalfWidth;

      // Check if intervals overlap
      if (!(newEnd <= doorStart || newStart >= doorEnd)) {
        return false;
      }
    }

    // Check windows on the same wall
    for (const window of room.windows) {
      if (window.id === opening.id) continue; // Skip self
      if (window.wallId !== opening.wallId) continue;

      const windowHalfWidth = window.width / 2;
      const windowCenterDist = window.position * wallLength;
      const windowStart = windowCenterDist - windowHalfWidth;
      const windowEnd = windowCenterDist + windowHalfWidth;

      // Check if intervals overlap
      if (!(newEnd <= windowStart || newStart >= windowEnd)) {
        return false;
      }
    }

    return true;
  };

  const handleDoorDragStart = (door: Door, wall: Wall, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    setDraggingDoor({ id: door.id, initialPosition: door.position, wallId: door.wallId, lastValidPosition: door.position });
  };

  const handleDoorDragMove = (door: Door, wall: Wall, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (!draggingDoor || draggingDoor.id !== door.id) return;

    // Get current group position (already constrained by dragBoundFunc)
    const group = e.target;
    if (!group) return;

    const groupX = group.x();
    const groupY = group.y();

    // Calculate wall direction and length
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    if (wallLength === 0) return;

    // Calculate position along wall (0-1)
    const relX = groupX - wall.a.x;
    const relY = groupY - wall.a.y;
    const wallDirX = dx / wallLength;
    const wallDirY = dy / wallLength;
    const distance = relX * wallDirX + relY * wallDirY;
    const newPosition = Math.max(0, Math.min(1, distance / wallLength));

    // Validate position - only track last valid position, don't update store yet
    if (isValidPosition(door, newPosition)) {
      setDraggingDoor({ ...draggingDoor, lastValidPosition: newPosition });
    } else {
      // If invalid, revert to last valid position
      const lastValidCenter = getPointOnWall(wall, draggingDoor.lastValidPosition);
      group.x(lastValidCenter.x);
      group.y(lastValidCenter.y);
    }
  };

  const handleDoorDragEnd = (door: Door, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (draggingDoor && draggingDoor.id === door.id) {
      // Update position in store only at the end
      updateDoor(door.id, { position: draggingDoor.lastValidPosition });
    }
    setDraggingDoor(null);
  };

  const handleWindowDragStart = (window: Window, wall: Wall, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    setDraggingWindow({ id: window.id, initialPosition: window.position, wallId: window.wallId, lastValidPosition: window.position });
  };

  const handleWindowDragMove = (window: Window, wall: Wall, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (!draggingWindow || draggingWindow.id !== window.id) return;

    // Get current group position (already constrained by dragBoundFunc)
    const group = e.target;
    if (!group) return;

    const groupX = group.x();
    const groupY = group.y();

    // Calculate wall direction and length
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    if (wallLength === 0) return;

    // Calculate position along wall (0-1)
    const relX = groupX - wall.a.x;
    const relY = groupY - wall.a.y;
    const wallDirX = dx / wallLength;
    const wallDirY = dy / wallLength;
    const distance = relX * wallDirX + relY * wallDirY;
    const newPosition = Math.max(0, Math.min(1, distance / wallLength));

    // Validate position - only track last valid position, don't update store yet
    if (isValidPosition(window, newPosition)) {
      setDraggingWindow({ ...draggingWindow, lastValidPosition: newPosition });
    } else {
      // If invalid, revert to last valid position
      const lastValidCenter = getPointOnWall(wall, draggingWindow.lastValidPosition);
      group.x(lastValidCenter.x);
      group.y(lastValidCenter.y);
    }
  };

  const handleWindowDragEnd = (window: Window, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (draggingWindow && draggingWindow.id === window.id) {
      // Update position in store only at the end
      updateWindow(window.id, { position: draggingWindow.lastValidPosition });
    }
    setDraggingWindow(null);
  };

  return (
    <>
      {/* Doors */}
      {doors.map((door) => {
        const wall = getWallById(door.wallId);
        if (!wall) return null;

        // Use dragging position if currently dragging, otherwise use door position
        const currentPosition = draggingDoor && draggingDoor.id === door.id 
          ? draggingDoor.lastValidPosition 
          : door.position;
        const center = getPointOnWall(wall, currentPosition);
        const dx = wall.b.x - wall.a.x;
        const dy = wall.b.y - wall.a.y;
        const angle = Math.atan2(dy, dx);

        const doorWidth = door.width;
        const doorHalfWidth = doorWidth / 2;

        const isSelected = selectedDoorId === door.id;

        return (
          <Group 
            key={door.id}
            ref={(node) => {
              if (node) {
                doorGroupRefs.current.set(door.id, node);
              }
            }}
            x={center.x}
            y={center.y}
            draggable={(mode === 'select' || mode === 'doors') && isSelected}
            dragBoundFunc={(pos) => {
              // Constrain movement to wall line
              const dx = wall.b.x - wall.a.x;
              const dy = wall.b.y - wall.a.y;
              const wallLength = Math.sqrt(dx * dx + dy * dy);
              if (wallLength === 0) return { x: center.x, y: center.y };

              // Project position onto wall line
              const relX = pos.x - wall.a.x;
              const relY = pos.y - wall.a.y;
              const wallDirX = dx / wallLength;
              const wallDirY = dy / wallLength;
              const distance = relX * wallDirX + relY * wallDirY;
              const clampedDistance = Math.max(0, Math.min(wallLength, distance));

              // Return position on wall line
              return {
                x: wall.a.x + wallDirX * clampedDistance,
                y: wall.a.y + wallDirY * clampedDistance,
              };
            }}
            onDragStart={(e) => {
              e.cancelBubble = true;
              handleDoorDragStart(door, wall, e);
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              handleDoorDragMove(door, wall, e);
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              handleDoorDragEnd(door, e);
            }}
            onClick={(e) => {
              e.cancelBubble = true;
              if (mode === 'doors' || mode === 'select') {
                selectDoor(door.id);
              }
            }}
            onDblClick={(e) => {
              e.cancelBubble = true;
              if (mode === 'doors') {
                removeDoor(door.id);
              }
            }}
            onMouseEnter={(e) => {
              if ((mode === 'select' || mode === 'doors') && isSelected) {
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = 'move';
                }
              }
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                stage.container().style.cursor = 'default';
              }
            }}
          >
            {/* Invisible hit area for dragging - covers entire door area including icon */}
            <Rect
              x={-20}
              y={-20}
              width={doorWidth + 40}
              height={wall.thickness + 40}
              fill="transparent"
              rotation={(angle * 180) / Math.PI}
              offsetX={doorHalfWidth + 20}
              offsetY={wall.thickness / 2 + 20}
            />
            {/* Door opening (gap in wall) */}
            <Line
              points={[-doorHalfWidth, 0, doorHalfWidth, 0]}
              stroke={domovoyCanvas.primaryMid}
              strokeWidth={wall.thickness}
              lineCap="butt"
              visible={false} // Hide the background line to avoid "thick/thin" look
              rotation={(angle * 180) / Math.PI}
              listening={false}
            />
            {/* Door rectangle */}
            <Rect
              x={0}
              y={0}
              width={doorWidth}
              height={wall.thickness} // Fill wall thickness
              fill={domovoyCanvas.primaryMid}
              opacity={0.7}
              rotation={(angle * 180) / Math.PI}
              offsetX={doorHalfWidth}
              offsetY={wall.thickness / 2}
              listening={false}
            />
            {/* Selection highlight */}
            {isSelected && (
              <>
                <Rect
                  x={0}
                  y={0}
                  width={doorWidth + 8}
                  height={wall.thickness + 8}
                  fill="transparent"
                  stroke={domovoyCanvas.selection}
                  strokeWidth={2}
                  rotation={(angle * 180) / Math.PI}
                  offsetX={doorHalfWidth + 4}
                  offsetY={wall.thickness / 2 + 4}
                  dash={[5, 5]}
                  listening={false}
                />
                {/* Resize handles - positioned perpendicular to wall */}
                <Circle
                  x={-doorHalfWidth}
                  y={-15}
                  radius={8}
                  fill={domovoyCanvas.handle}
                  stroke={domovoyCanvas.onAccent}
                  strokeWidth={3}
                  shadowBlur={4}
                  shadowColor={domovoyCanvas.shadow}
                  draggable={mode === 'select' || mode === 'doors'}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleDoorResizeStart(door, wall, 'left', e);
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleDoorResizeMove(door, wall, 'left', e);
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleDoorResizeEnd(e);
                  }}
                  onMouseDown={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                  }}
                  onMouseEnter={(e) => {
                    e.cancelBubble = true;
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'ew-resize';
                    }
                    // Highlight on hover
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handleHover);
                    shape.scale({ x: 1.2, y: 1.2 });
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
                    // Reset on leave
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handle);
                    shape.scale({ x: 1, y: 1 });
                  }}
                />
                <Circle
                  x={doorHalfWidth}
                  y={-15}
                  radius={8}
                  fill={domovoyCanvas.handle}
                  stroke={domovoyCanvas.onAccent}
                  strokeWidth={3}
                  shadowBlur={4}
                  shadowColor={domovoyCanvas.shadow}
                  draggable={mode === 'select' || mode === 'doors'}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleDoorResizeStart(door, wall, 'right', e);
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleDoorResizeMove(door, wall, 'right', e);
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleDoorResizeEnd(e);
                  }}
                  onMouseDown={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                  }}
                  onMouseEnter={(e) => {
                    e.cancelBubble = true;
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'ew-resize';
                    }
                    // Highlight on hover
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handleHover);
                    shape.scale({ x: 1.2, y: 1.2 });
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
                    // Reset on leave
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handle);
                    shape.scale({ x: 1, y: 1 });
                  }}
                />
              </>
            )}
            <Text
              text="🚪"
              x={-10}
              y={-10}
              fontSize={16}
              listening={false}
            />
          </Group>
        );
      })}

      {/* Windows */}
      {windows.map((window) => {
        const wall = getWallById(window.wallId);
        if (!wall) return null;

        // Use dragging position if currently dragging, otherwise use window position
        const currentPosition = draggingWindow && draggingWindow.id === window.id 
          ? draggingWindow.lastValidPosition 
          : window.position;
        const center = getPointOnWall(wall, currentPosition);
        const dx = wall.b.x - wall.a.x;
        const dy = wall.b.y - wall.a.y;
        const angle = Math.atan2(dy, dx);

        const windowWidth = window.width;
        const windowHalfWidth = windowWidth / 2;

        const isSelected = selectedWindowId === window.id;

        return (
          <Group 
            key={window.id}
            ref={(node) => {
              if (node) {
                windowGroupRefs.current.set(window.id, node);
              }
            }}
            x={center.x}
            y={center.y}
            draggable={(mode === 'select' || mode === 'windows') && isSelected}
            dragBoundFunc={(pos) => {
              // Constrain movement to wall line
              const dx = wall.b.x - wall.a.x;
              const dy = wall.b.y - wall.a.y;
              const wallLength = Math.sqrt(dx * dx + dy * dy);
              if (wallLength === 0) return { x: center.x, y: center.y };

              // Project position onto wall line
              const relX = pos.x - wall.a.x;
              const relY = pos.y - wall.a.y;
              const wallDirX = dx / wallLength;
              const wallDirY = dy / wallLength;
              const distance = relX * wallDirX + relY * wallDirY;
              const clampedDistance = Math.max(0, Math.min(wallLength, distance));

              // Return position on wall line
              return {
                x: wall.a.x + wallDirX * clampedDistance,
                y: wall.a.y + wallDirY * clampedDistance,
              };
            }}
            onDragStart={(e) => {
              e.cancelBubble = true;
              handleWindowDragStart(window, wall, e);
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              handleWindowDragMove(window, wall, e);
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              handleWindowDragEnd(window, e);
            }}
            onClick={(e) => {
              e.cancelBubble = true;
              if (mode === 'windows' || mode === 'select') {
                selectWindow(window.id);
              }
            }}
            onDblClick={(e) => {
              e.cancelBubble = true;
              if (mode === 'windows') {
                removeWindow(window.id);
              }
            }}
            onMouseEnter={(e) => {
              if ((mode === 'select' || mode === 'windows') && isSelected) {
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = 'move';
                }
              }
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                stage.container().style.cursor = 'default';
              }
            }}
          >
            {/* Invisible hit area for dragging - covers entire window area including icon */}
            <Rect
              x={-20}
              y={-20}
              width={windowWidth + 40}
              height={wall.thickness + 40}
              fill="transparent"
              rotation={(angle * 180) / Math.PI}
              offsetX={windowHalfWidth + 20}
              offsetY={wall.thickness / 2 + 20}
            />
            {/* Window opening */}
            <Line
              points={[-windowHalfWidth, 0, windowHalfWidth, 0]}
              stroke={domovoyCanvas.teal}
              strokeWidth={wall.thickness}
              lineCap="butt"
              visible={false}
              rotation={(angle * 180) / Math.PI}
              listening={false}
            />
            {/* Window frame */}
            <Rect
              x={0}
              y={0}
              width={windowWidth}
              height={wall.thickness}
              fill={domovoyCanvas.teal}
              opacity={0.5}
              rotation={(angle * 180) / Math.PI}
              offsetX={windowHalfWidth}
              offsetY={wall.thickness / 2}
              listening={false}
            />
            {/* Selection highlight */}
            {isSelected && (
              <>
                <Rect
                  x={0}
                  y={0}
                  width={windowWidth + 8}
                  height={wall.thickness + 8}
                  fill="transparent"
                  stroke={domovoyCanvas.selection}
                  strokeWidth={2}
                  rotation={(angle * 180) / Math.PI}
                  offsetX={windowHalfWidth + 4}
                  offsetY={wall.thickness / 2 + 4}
                  dash={[5, 5]}
                  listening={false}
                />
                {/* Resize handles - positioned perpendicular to wall */}
                <Circle
                  x={-windowHalfWidth}
                  y={-15}
                  radius={8}
                  fill={domovoyCanvas.handle}
                  stroke={domovoyCanvas.onAccent}
                  strokeWidth={3}
                  shadowBlur={4}
                  shadowColor={domovoyCanvas.shadow}
                  draggable={mode === 'select' || mode === 'windows'}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleWindowResizeStart(window, wall, 'left', e);
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleWindowResizeMove(window, wall, 'left', e);
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleWindowResizeEnd(e);
                  }}
                  onMouseDown={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                  }}
                  onMouseEnter={(e) => {
                    e.cancelBubble = true;
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'ew-resize';
                    }
                    // Highlight on hover
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handleHover);
                    shape.scale({ x: 1.2, y: 1.2 });
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
                    // Reset on leave
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handle);
                    shape.scale({ x: 1, y: 1 });
                  }}
                />
                <Circle
                  x={windowHalfWidth}
                  y={-15}
                  radius={8}
                  fill={domovoyCanvas.handle}
                  stroke={domovoyCanvas.onAccent}
                  strokeWidth={3}
                  shadowBlur={4}
                  shadowColor={domovoyCanvas.shadow}
                  draggable={mode === 'select' || mode === 'windows'}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleWindowResizeStart(window, wall, 'right', e);
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleWindowResizeMove(window, wall, 'right', e);
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                    handleWindowResizeEnd(e);
                  }}
                  onMouseDown={(e) => {
                    e.cancelBubble = true;
                    e.evt.stopPropagation();
                  }}
                  onMouseEnter={(e) => {
                    e.cancelBubble = true;
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'ew-resize';
                    }
                    // Highlight on hover
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handleHover);
                    shape.scale({ x: 1.2, y: 1.2 });
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
                    // Reset on leave
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handle);
                    shape.scale({ x: 1, y: 1 });
                  }}
                />
              </>
            )}
            <Text
              text="🪟"
              x={-10}
              y={-10}
              fontSize={16}
              listening={false}
            />
          </Group>
        );
      })}
    </>
  );
}
