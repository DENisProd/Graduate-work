'use client';

import { useMemo } from 'react';
import { Stage, Layer, Line, Group, Circle, Text, Rect } from 'react-konva';
import type { Device, Point, Room } from '@/domain/room-planner';
import type { PhysicalDeviceResponse, ZigbeeStateWire } from '@/types/api';
import { domovoyRoomPlanner, roomDeviceColor } from '@/lib/domovoy-canvas-palette';
import { getDeviceStatusLines } from '../../lib/device-status-lines';
import { useTheme } from '@/hooks';

const DEVICE_ICONS: Record<string, string> = {
  socket: '🔌',
  switch: '🔘',
  'motion-sensor': '👁️',
  'temperature-sensor': '🌡️',
  camera: '📹',
  dimmer: '💡',
};

const TONE_FILL: Record<NonNullable<ReturnType<typeof getDeviceStatusLines>[number]['tone']>, string> = {
  ok: '#059669',
  warn: '#d97706',
  muted: '#64748b',
  danger: '#dc2626',
};

interface Props {
  room: Room;
  deviceMap: Record<string, PhysicalDeviceResponse>;
  states: Map<string, ZigbeeStateWire>;
  width: number;
  height: number;
  showDeviceLabels: boolean;
  showMetrics: boolean;
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

function computeViewport(points: Point[], width: number, height: number) {
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

function DeviceMarker({
  device,
  physicalDevice,
  state,
  showDeviceLabels,
  showMetrics,
  resolvedTheme,
}: {
  device: Device;
  physicalDevice?: PhysicalDeviceResponse;
  state?: ZigbeeStateWire;
  showDeviceLabels: boolean;
  showMetrics: boolean;
  resolvedTheme: string;
}) {
  const physicalDeviceId = device.metadata?.physicalDeviceId as string | undefined;
  const name =
    physicalDevice?.friendlyName ||
    physicalDevice?.name ||
    (device.metadata?.name as string | undefined) ||
    'Устройство';
  const statusLines = showMetrics
    ? getDeviceStatusLines(device.type, physicalDevice, state)
    : [];
  const icon = DEVICE_ICONS[device.type] || '📦';
  const color = roomDeviceColor(device.type);
  const isOnline = statusLines[0]?.tone === 'ok';
  const labelWidth = 118;
  const labelHeight = 16 + statusLines.length * 13;

  return (
    <Group x={device.position.x} y={device.position.y}>
      <Circle
        radius={18}
        fill={color}
        stroke={isOnline ? '#22c55e' : '#94a3b8'}
        strokeWidth={2}
        opacity={0.95}
      />
      <Text text={icon} fontSize={14} x={-7} y={-7} listening={false} />
      {(showDeviceLabels || showMetrics) && (
        <Group x={22} y={-labelHeight / 2}>
          <Rect
            width={labelWidth}
            height={labelHeight}
            fill={resolvedTheme === 'dark' ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.94)'}
            stroke={resolvedTheme === 'dark' ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.55)'}
            strokeWidth={1}
            cornerRadius={6}
            shadowBlur={4}
            shadowOpacity={0.15}
          />
          {showDeviceLabels && (
            <Text
              text={name}
              fontSize={11}
              fontStyle="bold"
              fill={resolvedTheme === 'dark' ? '#f8fafc' : '#0f172a'}
              x={8}
              y={6}
              width={labelWidth - 12}
              ellipsis
              listening={false}
            />
          )}
          {showMetrics &&
            statusLines.map((line, index) => (
              <Text
                key={`${line.text}-${index}`}
                text={line.text}
                fontSize={10}
                fill={line.tone ? TONE_FILL[line.tone] : '#64748b'}
                x={8}
                y={(showDeviceLabels ? 22 : 8) + index * 13}
                width={labelWidth - 12}
                listening={false}
              />
            ))}
        </Group>
      )}
      {physicalDeviceId && !physicalDevice && (
        <Circle
          x={0}
          y={-22}
          radius={4}
          fill="#f59e0b"
          listening={false}
        />
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
  showDeviceLabels,
  showMetrics,
}: Props) {
  const { resolvedTheme } = useTheme();
  const points = useMemo(() => collectPoints(room), [room]);
  const viewport = useMemo(() => computeViewport(points, width, height), [points, width, height]);
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
            />
          ))}
          {room.devices.map((device) => {
            const physicalDeviceId = device.metadata?.physicalDeviceId as string | undefined;
            const physicalDevice = physicalDeviceId ? deviceMap[physicalDeviceId] : undefined;
            const state = physicalDeviceId ? states.get(physicalDeviceId) : undefined;
            return (
              <DeviceMarker
                key={device.id}
                device={device}
                physicalDevice={physicalDevice}
                state={state}
                showDeviceLabels={showDeviceLabels}
                showMetrics={showMetrics}
                resolvedTheme={resolvedTheme}
              />
            );
          })}
        </Group>
      </Layer>
    </Stage>
  );
}
