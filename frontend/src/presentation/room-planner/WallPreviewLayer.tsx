'use client';

import { Line, Circle, Group, Text } from 'react-konva';
import type { Point, ProjectMode, Wall } from '@/domain/room-planner';
import { snapPoint, GRID_SIZE } from '@/domain/room-planner/snapping';
import { domovoyCanvas } from '@/lib/domovoy-canvas-palette';

interface WallPreviewLayerProps {
  mode: ProjectMode;
  mousePosition: Point | null;
  lastWallPoint: Point | null; // The last point of the wall chain or pending start
  selectedWallPoint: Point | null; // Point being moved
  selectedWallPointIndex: number | null; // Index of point being moved
  walls: Wall[];
  showGrid: boolean;
  pendingWallStart: Point | null; // Pending start point for new wall
}

export function WallPreviewLayer({
  mode,
  mousePosition,
  showGrid,
  pendingWallStart,
}: WallPreviewLayerProps) {
  if (!mousePosition) return null;

  const gridSize = showGrid ? GRID_SIZE : 1;

  // Case 1: Drawing new wall (walls mode)
  if (mode === 'walls') {
    // Only show preview if we have a pendingWallStart (user has selected start point)
    if (!pendingWallStart) {
      // No start point selected yet - just show a small indicator at mouse position
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
    
    // Snap the mouse position relative to pendingWallStart
    const snappedPos = snapPoint(mousePosition, gridSize, pendingWallStart);
    
    // Draw a line from pendingWallStart to the snapped mouse position
    return (
      <Group listening={false}>
        {/* Phantom Wall Line */}
        <Line
          points={[pendingWallStart.x, pendingWallStart.y, snappedPos.x, snappedPos.y]}
          stroke={domovoyCanvas.tealBright}
          strokeWidth={20} // Same as real wall
          opacity={0.3}
          lineCap="butt"
          dash={[10, 10]}
        />
        
        {/* Guide Line (thin) */}
        <Line
          points={[pendingWallStart.x, pendingWallStart.y, snappedPos.x, snappedPos.y]}
          stroke={domovoyCanvas.handleHover}
          strokeWidth={2}
          dash={[5, 5]}
        />
        
        {/* Endpoint preview */}
        <Circle
          x={snappedPos.x}
          y={snappedPos.y}
          radius={5}
          fill={domovoyCanvas.handle}
          listening={false}
        />

        {/* Length Label */}
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
