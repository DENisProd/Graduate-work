'use client';

import { Text, Line, Group } from 'react-konva';
import type { Wall } from '@/domain/room-planner';
import { domovoyRoomPlanner } from '@/lib/domovoy-canvas-palette';

interface MeasurementLayerProps {
  walls: Wall[];
  show: boolean;
}

export function MeasurementLayer({ walls, show }: MeasurementLayerProps) {
  if (!show || walls.length === 0) return null;

  const formatLength = (lengthPx: number): string => {
    const lengthCm = lengthPx;
    if (lengthCm < 100) {
      return `${Math.round(lengthCm)} см`;
    }
    const meters = lengthCm / 100;
    return `${meters.toFixed(2)} м`;
  };

  return (
    <>
      {walls.map((wall, index) => {
        const dx = wall.b.x - wall.a.x;
        const dy = wall.b.y - wall.a.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const centerX = (wall.a.x + wall.b.x) / 2;
        const centerY = (wall.a.y + wall.b.y) / 2;
        const angleRad = Math.atan2(dy, dx);
        let angle = angleRad * (180 / Math.PI);
        
        if (angle >= 90 || angle < -90) {
          angle += 180;
        }

        const perpAngle = angleRad * (180 / Math.PI) + 90;
        const offset = 20;
        const offsetX = Math.cos(perpAngle * Math.PI / 180) * offset;
        const offsetY = Math.sin(perpAngle * Math.PI / 180) * offset;

        return (
          <Group key={`measurement-${index}`}>
            <Line
              points={[
                wall.a.x + offsetX,
                wall.a.y + offsetY,
                wall.b.x + offsetX,
                wall.b.y + offsetY
              ]}
              stroke={domovoyRoomPlanner.measurement}
              strokeWidth={1}
              dash={[5, 5]}
              listening={false}
            />
            <Text
              x={centerX + offsetX}
              y={centerY + offsetY - 10}
              text={formatLength(length)}
              fontSize={12}
              fill={domovoyRoomPlanner.measurement}
              align="center"
              rotation={angle}
              offsetX={formatLength(length).length * 3}
              offsetY={6}
              listening={false}
            />
          </Group>
        );
      })}
    </>
  );
}

