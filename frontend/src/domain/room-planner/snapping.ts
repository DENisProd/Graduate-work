
import { Point } from './types';

export const GRID_SIZE = 50;

export function snapToGrid(point: Point, gridSize: number = GRID_SIZE): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

export function snapToAxis(
  point: Point,
  origin: Point,
  threshold: number = 20
): Point {
  const dx = Math.abs(point.x - origin.x);
  const dy = Math.abs(point.y - origin.y);

  if (dx < threshold) {
    return { x: origin.x, y: point.y };
  }
  if (dy < threshold) {
    return { x: point.x, y: origin.y };
  }

  return point;
}

export function isValidOpeningPosition(
  wall: { a: Point; b: Point; thickness: number },
  position: number,
  width: number,
  otherWalls: { a: Point; b: Point; thickness: number; id: string }[] = [],
  currentWallId?: string
): boolean {
  const wallLength = Math.sqrt(
    Math.pow(wall.b.x - wall.a.x, 2) + Math.pow(wall.b.y - wall.a.y, 2)
  );

  const halfWidth = width / 2;
  const centerDist = position * wallLength;

  if (centerDist - halfWidth < 0 || centerDist + halfWidth > wallLength) {
    return false;
  }

  const dx = wall.b.x - wall.a.x;
  const dy = wall.b.y - wall.a.y;
  const angle = Math.atan2(dy, dx);

  const center = {
    x: wall.a.x + dx * position,
    y: wall.a.y + dy * position
  };

  const startConnected = otherWalls.some(w =>
    (w.id !== currentWallId) &&
    (Math.abs(w.a.x - wall.a.x) < 1 && Math.abs(w.a.y - wall.a.y) < 1 ||
     Math.abs(w.b.x - wall.a.x) < 1 && Math.abs(w.b.y - wall.a.y) < 1)
  );

  const endConnected = otherWalls.some(w =>
    (w.id !== currentWallId) &&
    (Math.abs(w.a.x - wall.b.x) < 1 && Math.abs(w.a.y - wall.b.y) < 1 ||
     Math.abs(w.b.x - wall.b.x) < 1 && Math.abs(w.b.y - wall.b.y) < 1)
  );

  const margin = 20;

  if (startConnected && centerDist - halfWidth < margin) return false;
  if (endConnected && (wallLength - centerDist) - halfWidth < margin) return false;

  return true;
}

export function snapPoint(
  point: Point,
  gridSize: number = GRID_SIZE,
  alignTo?: Point
): Point {
  let snapped = snapToGrid(point, gridSize);

  if (alignTo) {
    if (Math.abs(snapped.x - alignTo.x) < 1) {
      snapped = { ...snapped, x: alignTo.x };
    }

    if (Math.abs(snapped.y - alignTo.y) < 1) {
      snapped = { ...snapped, y: alignTo.y };
    }
  }

  return snapped;
}
