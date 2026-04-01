'use client';

import { Line } from 'react-konva';

import { GRID_SIZE } from '@/domain/room-planner/snapping';

interface GridLayerProps {
  width: number;
  height: number;
  gridSize?: number;
  show?: boolean;
}

export function GridLayer({ width, height, gridSize = GRID_SIZE, show = true }: GridLayerProps) {
  if (!show) return null;

  const lines: JSX.Element[] = [];

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke="#E5E7EB"
        strokeWidth={0.5}
        listening={false}
        dash={[2, 2]}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke="#E5E7EB"
        strokeWidth={0.5}
        listening={false}
        dash={[2, 2]}
      />
    );
  }

  return <>{lines}</>;
}



