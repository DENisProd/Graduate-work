'use client';

import { useMemo } from 'react';
import { Stage, Layer, Line, Group, Circle, Text, Rect } from 'react-konva';
import type { Device, Point, Room } from '@/domain/room-planner';
import type { PhysicalDeviceResponse, ZigbeeStateWire } from '@/types/api';
import { domovoyRoomPlanner, roomDeviceColor } from '@/lib/domovoy-canvas-palette';
import { useTheme } from '@/hooks';
import { useAnimatedViewport, type Viewport } from './use-animated-viewport';
import type { FloorPlanSlideshowPhase } from './use-floor-plan-slideshow';

const DEVICE_ICONS: Record<string, string> = {
  socket: '🔌',
  switch: '🔘',
  'motion-sensor': '👁️',
  'temperature-sensor': '🌡️',
  camera: '📹',
  dimmer: '💡',
};

interface Props {
  room: Room;
  deviceMap: Record<string, PhysicalDeviceResponse>;
  states: Map<string, ZigbeeStateWire>;
  width: number;
  height: number;
  phase: FloorPlanSlideshowPhase;
  focusDevice?: Device | null;
}

function collectPoints(room: Room): Point[] {
  const points: Point[] = [];
  for (const wall of room.walls) {
    points.push(wall.a, wall.b);
  }
  for (const device of room.devices) {
    points.push(device.position);
  }
  return points;
}

function computeOverviewViewport(points: Point[], width: number, height: number): Viewport {
  if (points.length === 0) {
    return { scale: 1, offsetX: width / 2, offsetY: height / 2 };
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const contentW = Math.max(maxX - minX, 120);
  const contentH = Math.max(maxY - minY, 120);
  const padding = 48;
  const scale = Math.min(
    (width - padding * 2) / contentW,
    (height - padding * 2) / contentH,
    1.4,
  );
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    scale,
    offsetX: width / 2 - centerX * scale,
    offsetY: height / 2 - centerY * scale,
  };
}

function computeFocusViewport(device: Device, width: number, height: number): Viewport {
  const focusScale = Math.min(width / 180, height / 180, 2.8);
  return {
    scale: focusScale,
    offsetX: width / 2 - device.position.x * focusScale,
    offsetY: height / 2 - device.position.y * focusScale,
  };
}

function DeviceMarker({
  device,
  physicalDevice,
  state,
  isFocused,
  isDimmed,
}: {
  device: Device;
  physicalDevice?: PhysicalDeviceResponse;
  state?: ZigbeeStateWire;
  isFocused: boolean;
  isDimmed: boolean;
}) {
  const physicalDeviceId = device.metadata?.physicalDeviceId as string | undefined;
  const icon = DEVICE_ICONS[device.type] || '📦';
  const color = roomDeviceColor(device.type);
  const isOnline = state?.timestamp != null || physicalDevice?.lastSeen != null;
  const radius = isFocused ? 24 : 18;
  const opacity = isDimmed ? 0.35 : 0.95;

  return (
    <Group x={device.position.x} y={device.position.y} opacity={opacity}>
      {isFocused && (
        <Circle
          radius={34}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[6, 4]}
          listening={false}
        />
      )}
      <Circle
        radius={radius}
        fill={color}
        stroke={isOnline ? '#22c55e' : '#94a3b8'}
        strokeWidth={isFocused ? 3 : 2}
        opacity={0.95}
      />
      <Text text={icon} fontSize={isFocused ? 16 : 14} x={isFocused ? -8 : -7} y={isFocused ? -8 : -7} listening={false} />
      {physicalDeviceId && !physicalDevice && (
        <Circle x={0} y={-22} radius={4} fill="#f59e0b" listening={false} />
      )}
    </Group>
  );
}

export function FloorPlanReadonlyCanvas({
  room,
  deviceMap,
  states,
  width,
  height,
  phase,
  focusDevice,
}: Props) {
  const { resolvedTheme } = useTheme();
  const points = useMemo(() => collectPoints(room), [room]);

  const targetViewport = useMemo(() => {
    if (phase === 'focus' && focusDevice) {
      return computeFocusViewport(focusDevice, width, height);
    }
    return computeOverviewViewport(points, width, height);
  }, [focusDevice, height, phase, points, width]);

  const viewport = useAnimatedViewport(targetViewport, 900);
  const surface =
    resolvedTheme === 'dark'
      ? domovoyRoomPlanner.canvasSurfaceDark
      : domovoyRoomPlanner.canvasSurfaceLight;

  return (
    <Stage width={width} height={height}>
      <Layer>
        <Rect x={0} y={0} width={width} height={height} fill={surface} listening={false} />
        <Group x={viewport.offsetX} y={viewport.offsetY} scaleX={viewport.scale} scaleY={viewport.scale}>
          {room.walls.map((wall, index) => (
            <Line
              key={wall.id ?? `wall-${index}`}
              points={[wall.a.x, wall.a.y, wall.b.x, wall.b.y]}
              stroke={domovoyRoomPlanner.wallNeutral}
              strokeWidth={wall.thickness}
              lineCap="butt"
              lineJoin="miter"
              listening={false}
              opacity={phase === 'focus' ? 0.85 : 1}
            />
          ))}
          {room.devices.map((device) => {
            const physicalDeviceId = device.metadata?.physicalDeviceId as string | undefined;
            const physicalDevice = physicalDeviceId ? deviceMap[physicalDeviceId] : undefined;
            const state = physicalDeviceId ? states.get(physicalDeviceId) : undefined;
            const isFocused = phase === 'focus' && focusDevice?.id === device.id;
            const isDimmed = phase === 'focus' && !isFocused;

            return (
              <DeviceMarker
                key={device.id}
                device={device}
                physicalDevice={physicalDevice}
                state={state}
                isFocused={isFocused}
                isDimmed={isDimmed}
              />
            );
          })}
        </Group>
      </Layer>
    </Stage>
  );
}
