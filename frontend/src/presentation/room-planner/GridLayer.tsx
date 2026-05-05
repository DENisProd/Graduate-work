'use client';

import * as React from 'react';
import { Line } from 'react-konva';

import { GRID_SIZE } from '@/domain/room-planner/snapping';
import { useTheme } from '@/hooks';
import { domovoyRoomPlanner } from '@/lib/domovoy-canvas-palette';

interface GridLayerProps {
  width: number;
  height: number;
  gridSize?: number;
  show?: boolean;
}

export function GridLayer({ width, height, gridSize = GRID_SIZE, show = true }: GridLayerProps) {
  const { resolvedTheme } = useTheme();
  if (!show) return null;

  const stroke =
    resolvedTheme === 'dark'
      ? domovoyRoomPlanner.gridStrokeDark
      : domovoyRoomPlanner.gridStrokeLight;

  const lines: React.ReactElement[] = [];

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={stroke}
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
        stroke={stroke}
        strokeWidth={0.5}
        listening={false}
        dash={[2, 2]}
      />
    );
  }

  return <>{lines}</>;
}



