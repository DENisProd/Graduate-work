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
import {
  getRegionFill,
  regionLabelFill,
  regionStrokeColors,
  domovoyCanvas,
} from '@/lib/domovoy-canvas-palette';

function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let sx = 0, sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

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

  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const { default: strokeColor, selected: strokeSelected } = regionStrokeColors(theme);

  return (
    <>

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
            onClick={(e) => {
              e.cancelBubble = true;
              if (e.evt) e.evt.stopPropagation();
              if (mode === 'rooms' || mode === 'select') {
                selectRegion(region.id);
              }
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              if (e.evt) e.evt.stopPropagation();
              if (mode === 'rooms' || mode === 'select') {
                selectRegion(region.id);
              }
            }}
          />
        );
      })}

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
            fill={regionLabelFill(resolvedTheme)}
            align="center"
            verticalAlign="middle"
            offsetX={approxW / 2}
            offsetY={approxH / 2}
            listening={false}
          />
        );
      })}

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
              onClick={(e) => {
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
              onTap={(e) => {
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
              fill={
                isSelected
                  ? resolvedTheme === 'dark'
                    ? 'rgba(159, 168, 218, 0.95)'
                    : 'rgba(26, 35, 126, 0.92)'
                  : resolvedTheme === 'dark'
                    ? 'rgba(92, 107, 192, 0.88)'
                    : 'rgba(26, 35, 126, 0.78)'
              }
              stroke={resolvedTheme === 'dark' ? domovoyCanvas.secondaryLight : domovoyCanvas.primaryMid}
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
              onClick={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                setSelectedRegionPointIndex(i);
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                if (e.evt) e.evt.stopPropagation();
                setSelectedRegionPointIndex(i);
              }}
              onContextMenu={(e) => {
                e.evt.preventDefault();
                if (canDeleteVertex) removeRegionPoint(region.id, i);
              }}
            />
          );
        });
      })}

      {pendingRegionPoints.length > 0 && (
        <>
          <Line
            points={pendingRegionPoints.flatMap((p) => [p.x, p.y])}
            closed={false}
            stroke={
              resolvedTheme === 'dark' ? 'rgba(159, 168, 218, 0.85)' : 'rgba(26, 35, 126, 0.78)'
            }
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
              fill={
                i === 0 && pendingRegionPoints.length >= 3
                  ? 'rgba(0, 150, 136, 0.9)'
                  : resolvedTheme === 'dark'
                    ? 'rgba(159, 168, 218, 0.92)'
                    : 'rgba(26, 35, 126, 0.88)'
              }
              stroke={resolvedTheme === 'dark' ? domovoyCanvas.onAccent : domovoyCanvas.primary}
              strokeWidth={1}
              listening={false}
            />
          ))}
        </>
      )}
    </>
  );
}
