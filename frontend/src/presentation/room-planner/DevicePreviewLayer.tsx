import { Group, Circle, Text } from 'react-konva';
import type { DeviceType } from '@/domain/room-planner';
import { useMemo } from 'react';

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

const DEVICE_COLORS: Record<string, string> = {
  socket: '#10B981',
  switch: '#3B82F6',
  'motion-sensor': '#F59E0B',
  'temperature-sensor': '#EF4444',
  camera: '#8B5CF6',
  dimmer: '#FBBF24',
};

export function DevicePreviewLayer({ type, mousePosition }: DevicePreviewLayerProps) {
  const preview = useMemo(() => {
    if (!type || !mousePosition) return null;

    const color = DEVICE_COLORS[type] || '#6B7280';
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
          stroke="#FFFFFF"
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
