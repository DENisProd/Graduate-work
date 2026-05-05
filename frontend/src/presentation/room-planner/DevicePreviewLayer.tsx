'use client';

import { Group, Circle, Text } from 'react-konva';
import type { DeviceType } from '@/domain/room-planner';
import { useMemo } from 'react';
import { domovoyCanvas, roomDeviceColor } from '@/lib/domovoy-canvas-palette';

interface DevicePreviewLayerProps {
  type: DeviceType | null;
  mousePosition: { x: number; y: number } | null;
}

const DEVICE_ICONS: Record<string, string> = {
  socket: '🔌',
  switch: '🔘',
  'motion-sensor': '👁️',
  'temperature-sensor': '🌡️',
  camera: '📹',
  dimmer: '💡',
};

export function DevicePreviewLayer({ type, mousePosition }: DevicePreviewLayerProps) {
  const preview = useMemo(() => {
    if (!type || !mousePosition) return null;

    const color = roomDeviceColor(type);
    const icon = DEVICE_ICONS[type] || '📦';

    return (
      <Group
        x={mousePosition.x}
        y={mousePosition.y}
        opacity={0.6}
        listening={false}
      >
        <Circle
          radius={20}
          fill={color}
          stroke={domovoyCanvas.onAccent}
          strokeWidth={1}
          dash={[5, 5]}
        />
        <Text
          text={icon}
          fontSize={16}
          x={-8}
          y={-8}
        />
      </Group>
    );
  }, [type, mousePosition]);

  return preview;
}
