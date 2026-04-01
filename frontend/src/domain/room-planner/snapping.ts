
import { Point } from './types';

export const GRID_SIZE = 50; // 50px = 50cm

/**
 * Snaps a point to the nearest grid intersection
 */
export function snapToGrid(point: Point, gridSize: number = GRID_SIZE): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Snaps a point to be orthogonal (horizontal or vertical) relative to an origin point
 * if it's close to the axis
 */
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

/**
 * Checks if an opening (door/window) can be placed at the given position
 */
export function isValidOpeningPosition(
  wall: { a: Point; b: Point; thickness: number },
  position: number, // 0 to 1
  width: number,
  otherWalls: { a: Point; b: Point; thickness: number; id: string }[] = [],
  currentWallId?: string
): boolean {
  const wallLength = Math.sqrt(
    Math.pow(wall.b.x - wall.a.x, 2) + Math.pow(wall.b.y - wall.a.y, 2)
  );
  
  // 1. Check if opening fits within the wall (not sticking out of endpoints)
  const halfWidth = width / 2;
  const centerDist = position * wallLength;
  
  if (centerDist - halfWidth < 0 || centerDist + halfWidth > wallLength) {
    return false;
  }

  // 2. Check for intersections with other walls (corners/T-junctions)
  // We need to check if the opening rect intersects with any other wall rects
  // This is a simplified check: just check distance from endpoints if they are connected to other walls
  
  // Calculate absolute coordinates of the opening endpoints
  const dx = wall.b.x - wall.a.x;
  const dy = wall.b.y - wall.a.y;
  const angle = Math.atan2(dy, dx);
  
  const center = {
    x: wall.a.x + dx * position,
    y: wall.a.y + dy * position
  };
  
  // Check if endpoints are connected to other walls
  // If so, ensure we leave some space (e.g. wall thickness)
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

  const margin = 20; // Minimum distance from corners
  
  if (startConnected && centerDist - halfWidth < margin) return false;
  if (endConnected && (wallLength - centerDist) - halfWidth < margin) return false;

  return true;
}

/**
 * Combined snapping: first snap to grid, then check alignment
 */
export function snapPoint(
  point: Point,
  gridSize: number = GRID_SIZE,
  alignTo?: Point
): Point {
  // First snap to grid
  let snapped = snapToGrid(point, gridSize);

  // If we have a point to align to (e.g., previous wall point)
  if (alignTo) {
    // Check if we should align horizontally or vertically
    // We prefer orthogonal lines, so if the snapped point is close to being aligned, force it
    
    // Check vertical alignment (same X)
    if (Math.abs(snapped.x - alignTo.x) < 1) {
      snapped = { ...snapped, x: alignTo.x };
    }
    
    // Check horizontal alignment (same Y)
    if (Math.abs(snapped.y - alignTo.y) < 1) {
      snapped = { ...snapped, y: alignTo.y };
    }
  }

  return snapped;
}
