'use client';

import { Line, Group, Rect, Text } from 'react-konva';
import type { Wall, ProjectMode } from '@/domain/room-planner';
import { useMemo } from 'react';

interface DoorWindowPreviewLayerProps {
  walls: Wall[];
  mode: ProjectMode;
  mousePosition: { x: number; y: number } | null;
  lastValidPosition?: { wallId: string; position: number; point: { x: number; y: number } } | null;
}

import { isValidOpeningPosition } from '@/domain/room-planner/snapping';

export function DoorWindowPreviewLayer({
  walls,
  mode,
  mousePosition,
  lastValidPosition,
}: DoorWindowPreviewLayerProps) {
  const preview = useMemo(() => {
    if (!mousePosition || (mode !== 'doors' && mode !== 'windows')) return null;

    // Find closest wall
    let closestWall: Wall | null = null;
    let closestDistance = Infinity;
    let closestPosition = 0;

    for (const wall of walls) {
      const wallLength = Math.sqrt(
        Math.pow(wall.b.x - wall.a.x, 2) + Math.pow(wall.b.y - wall.a.y, 2)
      );
      if (wallLength === 0) continue;

      const dx = wall.b.x - wall.a.x;
      const dy = wall.b.y - wall.a.y;
      const t = Math.max(0, Math.min(1, ((mousePosition.x - wall.a.x) * dx + (mousePosition.y - wall.a.y) * dy) / (wallLength * wallLength)));
      const projX = wall.a.x + t * dx;
      const projY = wall.a.y + t * dy;
      const distance = Math.sqrt(Math.pow(mousePosition.x - projX, 2) + Math.pow(mousePosition.y - projY, 2));

      if (distance < closestDistance && distance < 50) {
        closestDistance = distance;
        closestWall = wall;
        closestPosition = t;
      }
    }

    if (!closestWall) return null;

    // Determine which position to use: current or last valid
    let targetWall = closestWall;
    let targetPosition = closestPosition;
    let isPhantom = false;

    const isValidCurrent = isValidOpeningPosition(
      closestWall,
      closestPosition,
      mode === 'doors' ? 80 : 100,
      walls.map((wall) => ({ ...wall, id: wall.id ?? '' })),
      closestWall.id ?? ''
    );

    if (!isValidCurrent) {
      if (lastValidPosition) {
        // Use last valid position
        const savedWall = walls.find(w => w.id === lastValidPosition.wallId);
        if (savedWall) {
          targetWall = savedWall;
          targetPosition = lastValidPosition.position;
          isPhantom = true; // Mark as phantom/stuck
        } else {
          return null;
        }
      } else {
        // No valid position ever found
        return null;
      }
    }

    const center = {
      x: targetWall.a.x + (targetWall.b.x - targetWall.a.x) * targetPosition,
      y: targetWall.a.y + (targetWall.b.y - targetWall.a.y) * targetPosition,
    };

    const dx = targetWall.b.x - targetWall.a.x;
    const dy = targetWall.b.y - targetWall.a.y;
    const angle = Math.atan2(dy, dx);

    const width = mode === 'doors' ? 80 : 100;
    const halfWidth = width / 2;

    const start = {
      x: center.x - Math.cos(angle) * halfWidth,
      y: center.y - Math.sin(angle) * halfWidth,
    };
    const end = {
      x: center.x + Math.cos(angle) * halfWidth,
      y: center.y + Math.sin(angle) * halfWidth,
    };

    // Calculate perpendicular offset for the "opening" look
    return (
      <Group>
        {/* Preview Line */}
        <Line
          points={[start.x, start.y, end.x, end.y]}
          stroke={isPhantom ? "#9CA3AF" : (mode === 'doors' ? "#8B5CF6" : "#3B82F6")}
          strokeWidth={targetWall.thickness + 4}
          lineCap="butt"
          opacity={isPhantom ? 0.3 : 0.5}
          dash={isPhantom ? [5, 5] : undefined}
        />
        {/* Frame Preview */}
        <Rect
          x={center.x}
          y={center.y}
          width={width}
          height={10}
          fill={isPhantom ? "#9CA3AF" : (mode === 'doors' ? "#8B5CF6" : "#3B82F6")}
          opacity={isPhantom ? 0.3 : 0.5}
          rotation={(angle * 180) / Math.PI}
          offsetX={halfWidth}
          offsetY={5}
        />
        {/* Icon */}
        <Text
          text={mode === 'doors' ? "🚪" : "🪟"}
          x={center.x - 10}
          y={center.y - 10}
          fontSize={16}
          opacity={isPhantom ? 0.5 : 0.8}
        />
      </Group>
    );
  }, [mousePosition, walls, mode, lastValidPosition]);

  return preview;
}
