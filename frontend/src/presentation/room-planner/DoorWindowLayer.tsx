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

  const doorGroupRefs = useRef<Map<string, KonvaGroup>>(new Map());
  const windowGroupRefs = useRef<Map<string, KonvaGroup>>(new Map());

  const isValidWidth = (opening: { wallId: string; position: number; width: number; id: string }, newWidth: number): boolean => {
    const wall = walls.find(w => w.id === opening.wallId);
    if (!wall) return false;

    if (!isValidOpeningPosition(
      wall,
      opening.position,
      newWidth,
      walls.map(w => ({ ...w, id: w.id || '' })),
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

    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    const worldX = (pointerPos.x - stageX) / scale;
    const worldY = (pointerPos.y - stageY) / scale;

    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    if (wallLength === 0) return;

    const wallDirX = dx / wallLength;
    const wallDirY = dy / wallLength;
    const center = resizingDoor.initialCenter;

    const relX = worldX - center.x;
    const relY = worldY - center.y;
    const currentHandleDistance = relX * wallDirX + relY * wallDirY;

    let newWidth: number;
    const initialHalfWidth = resizingDoor.initialWidth / 2;
    if (handle === 'left') {
      newWidth = 2 * (initialHalfWidth - currentHandleDistance);
    } else {
      newWidth = 2 * (currentHandleDistance - (-initialHalfWidth));
    }

    newWidth = Math.max(20, Math.min(500, newWidth));

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

    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    const worldX = (pointerPos.x - stageX) / scale;
    const worldY = (pointerPos.y - stageY) / scale;

    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    if (wallLength === 0) return;

    const wallDirX = dx / wallLength;
    const wallDirY = dy / wallLength;
    const center = resizingWindow.initialCenter;

    const relX = worldX - center.x;
    const relY = worldY - center.y;
    const currentHandleDistance = relX * wallDirX + relY * wallDirY;

    let newWidth: number;
    const initialHalfWidth = resizingWindow.initialWidth / 2;
    if (handle === 'left') {
      newWidth = 2 * (initialHalfWidth - currentHandleDistance);
    } else {
      newWidth = 2 * (currentHandleDistance - (-initialHalfWidth));
    }

    newWidth = Math.max(20, Math.min(500, newWidth));

    if (isValidWidth(window, newWidth)) {
      updateWindow(window.id, { width: newWidth });
    }
  };

  const handleWindowResizeEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    setResizingWindow(null);
  };

  const isValidPosition = (opening: { wallId: string; position: number; width: number; id: string }, newPosition: number): boolean => {
    const wall = walls.find(w => w.id === opening.wallId);
    if (!wall) return false;

    if (!isValidOpeningPosition(
      wall,
      newPosition,
      opening.width,
      walls.map(w => ({ ...w, id: w.id || '' })),
      wall.id || ''
    )) {
      return false;
    }

    const wallLength = Math.sqrt(
      Math.pow(wall.b.x - wall.a.x, 2) + Math.pow(wall.b.y - wall.a.y, 2)
    );
    const halfWidth = opening.width / 2;
    const centerDist = newPosition * wallLength;
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

  const handleDoorDragStart = (door: Door, wall: Wall, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    setDraggingDoor({ id: door.id, initialPosition: door.position, wallId: door.wallId, lastValidPosition: door.position });
  };

  const handleDoorDragMove = (door: Door, wall: Wall, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (!draggingDoor || draggingDoor.id !== door.id) return;

    const group = e.target;
    if (!group) return;

    const groupX = group.x();
    const groupY = group.y();

    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    if (wallLength === 0) return;

    const relX = groupX - wall.a.x;
    const relY = groupY - wall.a.y;
    const wallDirX = dx / wallLength;
    const wallDirY = dy / wallLength;
    const distance = relX * wallDirX + relY * wallDirY;
    const newPosition = Math.max(0, Math.min(1, distance / wallLength));

    if (isValidPosition(door, newPosition)) {
      setDraggingDoor({ ...draggingDoor, lastValidPosition: newPosition });
    } else {
      const lastValidCenter = getPointOnWall(wall, draggingDoor.lastValidPosition);
      group.x(lastValidCenter.x);
      group.y(lastValidCenter.y);
    }
  };

  const handleDoorDragEnd = (door: Door, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (draggingDoor && draggingDoor.id === door.id) {
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

    const group = e.target;
    if (!group) return;

    const groupX = group.x();
    const groupY = group.y();

    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    if (wallLength === 0) return;

    const relX = groupX - wall.a.x;
    const relY = groupY - wall.a.y;
    const wallDirX = dx / wallLength;
    const wallDirY = dy / wallLength;
    const distance = relX * wallDirX + relY * wallDirY;
    const newPosition = Math.max(0, Math.min(1, distance / wallLength));

    if (isValidPosition(window, newPosition)) {
      setDraggingWindow({ ...draggingWindow, lastValidPosition: newPosition });
    } else {
      const lastValidCenter = getPointOnWall(wall, draggingWindow.lastValidPosition);
      group.x(lastValidCenter.x);
      group.y(lastValidCenter.y);
    }
  };

  const handleWindowDragEnd = (window: Window, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (draggingWindow && draggingWindow.id === window.id) {
      updateWindow(window.id, { position: draggingWindow.lastValidPosition });
    }
    setDraggingWindow(null);
  };

  return (
    <>
      {doors.map((door) => {
        const wall = getWallById(door.wallId);
        if (!wall) return null;

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
              const dx = wall.b.x - wall.a.x;
              const dy = wall.b.y - wall.a.y;
              const wallLength = Math.sqrt(dx * dx + dy * dy);
              if (wallLength === 0) return { x: center.x, y: center.y };

              const relX = pos.x - wall.a.x;
              const relY = pos.y - wall.a.y;
              const wallDirX = dx / wallLength;
              const wallDirY = dy / wallLength;
              const distance = relX * wallDirX + relY * wallDirY;
              const clampedDistance = Math.max(0, Math.min(wallLength, distance));

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
            <Line
              points={[-doorHalfWidth, 0, doorHalfWidth, 0]}
              stroke={domovoyCanvas.primaryMid}
              strokeWidth={wall.thickness}
              lineCap="butt"
              visible={false} // hides the line to avoid a "thick/thin" visual artifact
              rotation={(angle * 180) / Math.PI}
              listening={false}
            />
            <Rect
              x={0}
              y={0}
              width={doorWidth}
              height={wall.thickness}
              fill={domovoyCanvas.primaryMid}
              opacity={0.7}
              rotation={(angle * 180) / Math.PI}
              offsetX={doorHalfWidth}
              offsetY={wall.thickness / 2}
              listening={false}
            />
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
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handleHover);
                    shape.scale({ x: 1.2, y: 1.2 });
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
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
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handleHover);
                    shape.scale({ x: 1.2, y: 1.2 });
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
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

      {windows.map((window) => {
        const wall = getWallById(window.wallId);
        if (!wall) return null;

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
              const dx = wall.b.x - wall.a.x;
              const dy = wall.b.y - wall.a.y;
              const wallLength = Math.sqrt(dx * dx + dy * dy);
              if (wallLength === 0) return { x: center.x, y: center.y };

              const relX = pos.x - wall.a.x;
              const relY = pos.y - wall.a.y;
              const wallDirX = dx / wallLength;
              const wallDirY = dy / wallLength;
              const distance = relX * wallDirX + relY * wallDirY;
              const clampedDistance = Math.max(0, Math.min(wallLength, distance));

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
            <Line
              points={[-windowHalfWidth, 0, windowHalfWidth, 0]}
              stroke={domovoyCanvas.teal}
              strokeWidth={wall.thickness}
              lineCap="butt"
              visible={false}
              rotation={(angle * 180) / Math.PI}
              listening={false}
            />
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
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handleHover);
                    shape.scale({ x: 1.2, y: 1.2 });
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
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
                    const shape = e.target as KonvaShape;
                    shape.fill(domovoyCanvas.handleHover);
                    shape.scale({ x: 1.2, y: 1.2 });
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
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
