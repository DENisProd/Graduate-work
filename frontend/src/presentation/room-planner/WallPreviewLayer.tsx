'use client';

import { Line, Circle, Group, Text } from 'react-konva';
import type { Point, ProjectMode, Wall } from '@/domain/room-planner';
import { snapPoint, GRID_SIZE } from '@/domain/room-planner/snapping';
import { domovoyCanvas } from '@/lib/domovoy-canvas-palette';

interface WallPreviewLayerProps {
  mode: ProjectMode;
  mousePosition: Point | null;
  lastWallPoint: Point | null;
  selectedWallPoint: Point | null;
  selectedWallPointIndex: number | null;
  walls: Wall[];
  showGrid: boolean;
  pendingWallStart: Point | null;
}

export function WallPreviewLayer({
  mode,
  mousePosition,
  showGrid,
  pendingWallStart,
}: WallPreviewLayerProps) {
  if (!mousePosition) return null;

  const gridSize = showGrid ? GRID_SIZE : 1;

  if (mode === 'walls') {
    if (!pendingWallStart) {
      const snappedPos = snapPoint(mousePosition, gridSize);
      return (
        <Circle
          x={snappedPos.x}
          y={snappedPos.y}
          radius={5}
          fill={domovoyCanvas.handle}
          opacity={0.5}
          listening={false}
        />
      );
    }

    const snappedPos = snapPoint(mousePosition, gridSize, pendingWallStart);

    return (
      <Group listening={false}>
        <Line
          points={[pendingWallStart.x, pendingWallStart.y, snappedPos.x, snappedPos.y]}
          stroke={domovoyCanvas.tealBright}
          strokeWidth={20}
          opacity={0.3}
          lineCap="butt"
          dash={[10, 10]}
        />
        <Line
          points={[pendingWallStart.x, pendingWallStart.y, snappedPos.x, snappedPos.y]}
          stroke={domovoyCanvas.handleHover}
          strokeWidth={2}
          dash={[5, 5]}
        />
        <Circle
          x={snappedPos.x}
          y={snappedPos.y}
          radius={5}
          fill={domovoyCanvas.handle}
          listening={false}
        />
        <Text
          x={(pendingWallStart.x + snappedPos.x) / 2}
          y={(pendingWallStart.y + snappedPos.y) / 2}
          text={`${Math.round(Math.sqrt(Math.pow(snappedPos.x - pendingWallStart.x, 2) + Math.pow(snappedPos.y - pendingWallStart.y, 2)))}`}
          fontSize={14}
          fill={domovoyCanvas.handleHover}
          align="center"
          verticalAlign="middle"
          offsetX={10}
          offsetY={10}
        />
      </Group>
    );
  }

  return null;
}
