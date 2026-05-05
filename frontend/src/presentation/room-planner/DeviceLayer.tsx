'use client';

import { Group, Circle, Text } from 'react-konva';
import { useRoomPlannerStore } from '@/store/room-planner-store';
import type { Device, ProjectMode } from '@/domain/room-planner';
import type { KonvaEventObject } from 'konva/lib/Node';
import { domovoyCanvas, roomDeviceColor } from '@/lib/domovoy-canvas-palette';

interface DeviceLayerProps {
  devices: Device[];
  mode: ProjectMode;
}

const DEVICE_ICONS: Record<string, string> = {
  socket: '🔌',
  switch: '🔘',
  'motion-sensor': '👁️',
  'temperature-sensor': '🌡️',
  camera: '📹',
  dimmer: '💡',
};

export function DeviceLayer({ devices, mode }: DeviceLayerProps) {
  const selectedDeviceId = useRoomPlannerStore((state) => state.selectedDeviceId);
  const moveDevice = useRoomPlannerStore((state) => state.moveDevice);
  const selectDevice = useRoomPlannerStore((state) => state.selectDevice);
  const removeDevice = useRoomPlannerStore((state) => state.removeDevice);

  const saveDevicePosition = useRoomPlannerStore((state) => state.saveDevicePosition);

  const handleDragEnd = (device: Device, e: KonvaEventObject<DragEvent>) => {
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    moveDevice(device.id, newPosition);
    saveDevicePosition(device.id);
  };

  const handleClick = (device: Device, e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (selectedDeviceId === device.id) {
      selectDevice(null);
    } else {
      selectDevice(device.id);
    }
  };

  const handleDoubleClick = (device: Device, e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (mode === 'devices' || mode === 'select') {
      removeDevice(device.id);
    }
  };

  return (
    <>
      {devices.map((device) => {
        const isSelected = selectedDeviceId === device.id;
        const color = roomDeviceColor(device.type);
        const icon = DEVICE_ICONS[device.type] || '📦';

        return (
          <Group
            key={device.id}
            x={device.position.x}
            y={device.position.y}
            draggable={mode === 'devices' || mode === 'select'}
            onDragEnd={(e) => handleDragEnd(device, e)}
            onClick={(e) => handleClick(device, e)}
            onDblClick={(e) => handleDoubleClick(device, e)}
          >
            <Circle
              radius={20}
              fill={color}
              stroke={isSelected ? domovoyCanvas.selection : domovoyCanvas.onAccent}
              strokeWidth={isSelected ? 3 : 1}
              opacity={0.9}
            />
            <Text
              text={icon}
              fontSize={16}
              x={-8}
              y={-8}
              listening={false}
            />
            {isSelected && (
              <Circle
                radius={25}
                stroke={domovoyCanvas.primaryMid}
                strokeWidth={2}
                dash={[5, 5]}
                listening={false}
              />
            )}
          </Group>
        );
      })}
    </>
  );
}
