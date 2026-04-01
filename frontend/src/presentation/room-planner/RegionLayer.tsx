'use client';

import { useEffect, useState } from 'react';
import { Line, Circle, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useRoomPlannerStore } from '@/store/room-planner-store';
import { houseRoomsApi } from '@/lib/api-client';
import type { HouseRoomResponse } from '@/types/api';
import type { Point } from '@/domain/room-planner';
import { snapPoint } from '@/domain/room-planner/snapping';
import { GRID_SIZE } from '@/domain/room-planner/snapping';
import { useTheme } from '@/hooks';

const REGION_FILLS = [
  'rgba(59, 130, 246, 0.2)',
  'rgba(34, 197, 94, 0.2)',
  'rgba(234, 179, 8, 0.2)',
  'rgba(249, 115, 22, 0.2)',
  'rgba(168, 85, 247, 0.2)',
  'rgba(236, 72, 153, 0.2)',
];

function getRegionFill(index: number): string {
  return REGION_FILLS[index % REGION_FILLS.length];
}

function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let sx = 0, sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

/** Проекция точки P на отрезок A–B (ближайшая точка на отрезке) */
function projectPointOnSegment(P: Point, A: Point, B: Point): Point {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const d2 = dx * dx + dy * dy;
  if (d2 === 0) return A;
  let t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / d2;
  t = Math.max(0, Math.min(1, t));
  return { x: A.x + t * dx, y: A.y + t * dy };
}

export function RegionLayer() {
  const { resolvedTheme } = useTheme();
  const houseId = useRoomPlannerStore((state) => state.houseId);
  const roomRegions = useRoomPlannerStore((state) => state.roomRegions);
  const pendingRegionPoints = useRoomPlannerStore((state) => state.pendingRegionPoints);
  const selectedRegionId = useRoomPlannerStore((state) => state.selectedRegionId);
  const selectedRegionPointIndex = useRoomPlannerStore((state) => state.selectedRegionPointIndex);
  const showGrid = useRoomPlannerStore((state) => state.showGrid);
  const mode = useRoomPlannerStore((state) => state.mode);
  const selectRegion = useRoomPlannerStore((state) => state.selectRegion);
  const setSelectedRegionPointIndex = useRoomPlannerStore((state) => state.setSelectedRegionPointIndex);
  const moveRegionPoint = useRoomPlannerStore((state) => state.moveRegionPoint);
  const addRegionPoint = useRoomPlannerStore((state) => state.addRegionPoint);
  const removeRegionPoint = useRoomPlannerStore((state) => state.removeRegionPoint);

  const [houseRooms, setHouseRooms] = useState<HouseRoomResponse[]>([]);

  useEffect(() => {
    if (!houseId) return;
    houseRoomsApi
      .getByHouseId(houseId)
      .then((data) => setHouseRooms(Array.isArray(data) ? data : []))
      .catch(() => setHouseRooms([]));
  }, [houseId]);

  const strokeColor = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)';
  const strokeSelected = resolvedTheme === 'dark' ? 'rgba(96, 165, 250, 0.9)' : 'rgba(59, 130, 246, 0.9)';

  return (
    <>
      {/* Готовые области комнат */}
      {roomRegions.map((region, index) => {
        const points = region.points.flatMap((p) => [p.x, p.y]);
        const isSelected = selectedRegionId === region.id;
        const name = `region-fill-${region.id}`;
        return (
          <Line
            key={region.id}
            name={name}
            points={points}
            closed
            fill={getRegionFill(index)}
            stroke={isSelected ? strokeSelected : strokeColor}
            strokeWidth={isSelected ? 2.5 : 1}
            listening={mode === 'rooms' || mode === 'select'}
            onClick={(e: KonvaEventObject<MouseEvent>) => {
              e.cancelBubble = true;
              if (e.evt) e.evt.stopPropagation();
              if (mode === 'rooms' || mode === 'select') {
                selectRegion(region.id);
              }
            }}
            onTap={(e: KonvaEventObject<PointerEvent>) => {
              e.cancelBubble = true;
              if (e.evt) e.evt.stopPropagation();
              if (mode === 'rooms' || mode === 'select') {
                selectRegion(region.id);
              }
            }}
          />
        );
      })}
      {/* Подписи комнат */}
      {roomRegions.map((region) => {
        const houseRoomId = region.houseRoomId;
        const room =
          houseRoomId != null ? houseRooms.find((r) => String(r.id) === String(houseRoomId)) : null;
        const roomName = room ? (room.name ?? room.externalId ?? null) : null;
        if (!roomName) return null;
        const c = centroid(region.points);
        const approxW = roomName.length * 9;
        const approxH = 18;
        return (
          <Text
            key={`label-${region.id}`}
            x={c.x}
            y={c.y}
            text={roomName}
            fontSize={16}
            fontFamily="sans-serif"
            fill={resolvedTheme === 'dark' ? '#e5e7eb' : '#374151'}
            align="center"
            verticalAlign="middle"
            offsetX={approxW / 2}
            offsetY={approxH / 2}
            listening={false}
          />
        );
      })}
      {/* Кликабельные рёбра выбранной области — клик по ребру добавляет вершину */}
      {selectedRegionId && roomRegions.map((region) => {
        if (region.id !== selectedRegionId) return null;
        const pts = region.points;
        return pts.map((_, edgeIndex) => {
          const A = pts[edgeIndex];
          const B = pts[(edgeIndex + 1) % pts.length];
          const name = `region-edge-${region.id}-${edgeIndex}`;
          return (
            <Line
              key={`edge-${region.id}-${edgeIndex}`}
              name={name}
              points={[A.x, A.y, B.x, B.y]}
              stroke="transparent"
              strokeWidth={2}
              hitStrokeWidth={20}
              lineCap="round"
              listening={mode === 'rooms' || mode === 'select'}
              onClick={(e: KonvaEventObject<MouseEvent>) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                const stage = e.target.getStage();
                if (!stage) return;
                const pointer = stage.getPointerPosition();
                if (!pointer) return;
                const scaleX = stage.scaleX();
                const scaleY = stage.scaleY();
                const layerX = (pointer.x - stage.x()) / scaleX;
                const layerY = (pointer.y - stage.y()) / scaleY;
                const projected = projectPointOnSegment(
                  { x: layerX, y: layerY },
                  A,
                  B
                );
                addRegionPoint(region.id, edgeIndex, projected);
              }}
              onTap={(e: KonvaEventObject<PointerEvent>) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                const stage = e.target.getStage();
                if (!stage) return;
                const pointer = stage.getPointerPosition();
                if (!pointer) return;
                const scaleX = stage.scaleX();
                const scaleY = stage.scaleY();
                const layerX = (pointer.x - stage.x()) / scaleX;
                const layerY = (pointer.y - stage.y()) / scaleY;
                const projected = projectPointOnSegment(
                  { x: layerX, y: layerY },
                  A,
                  B
                );
                addRegionPoint(region.id, edgeIndex, projected);
              }}
            />
          );
        });
      })}
      {/* Редактируемые вершины выбранной области */}
      {selectedRegionId && roomRegions.map((region) => {
        if (region.id !== selectedRegionId) return null;
        const canDeleteVertex = region.points.length > 3;
        return region.points.map((p, i) => {
          const isSelected = selectedRegionPointIndex === i;
          const name = `region-point-${region.id}-${i}`;
          return (
            <Circle
              key={`vertex-${region.id}-${i}`}
              name={name}
              x={p.x}
              y={p.y}
              radius={isSelected ? 10 : 8}
              fill={isSelected ? 'rgba(59, 130, 246, 0.95)' : 'rgba(59, 130, 246, 0.8)'}
              stroke={resolvedTheme === 'dark' ? '#93c5fd' : '#1d4ed8'}
              strokeWidth={2}
              draggable
              listening={mode === 'rooms' || mode === 'select'}
              onDragMove={(e: KonvaEventObject<DragEvent>) => {
                const pos = e.target.position();
                moveRegionPoint(region.id, i, { x: pos.x, y: pos.y }, false);
              }}
              onDragEnd={(e: KonvaEventObject<DragEvent>) => {
                const pos = e.target.position();
                const snapped = snapPoint({ x: pos.x, y: pos.y }, showGrid ? GRID_SIZE : 1, undefined);
                moveRegionPoint(region.id, i, snapped, true);
                e.target.position({ x: snapped.x, y: snapped.y });
              }}
              onClick={(e: KonvaEventObject<MouseEvent>) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                setSelectedRegionPointIndex(i);
              }}
              onTap={(e: KonvaEventObject<PointerEvent>) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                setSelectedRegionPointIndex(i);
              }}
              onContextMenu={(e: KonvaEventObject<PointerEvent>) => {
                e.evt.preventDefault();
                if (canDeleteVertex) removeRegionPoint(region.id, i);
              }}
            />
          );
        });
      })}
      {/* Превью текущего полигона (точки + линии) */}
      {pendingRegionPoints.length > 0 && (
        <>
          <Line
            points={pendingRegionPoints.flatMap((p) => [p.x, p.y])}
            closed={false}
            stroke="rgba(59, 130, 246, 0.8)"
            strokeWidth={2}
            dash={[8, 4]}
            listening={false}
          />
          {pendingRegionPoints.map((p, i) => (
            <Circle
              key={`pending-${i}`}
              x={p.x}
              y={p.y}
              radius={i === 0 && pendingRegionPoints.length >= 3 ? 10 : 6}
              fill={i === 0 && pendingRegionPoints.length >= 3 ? 'rgba(34, 197, 94, 0.9)' : 'rgba(59, 130, 246, 0.9)'}
              stroke={resolvedTheme === 'dark' ? '#fff' : '#333'}
              strokeWidth={1}
              listening={false}
            />
          ))}
        </>
      )}
    </>
  );
}
