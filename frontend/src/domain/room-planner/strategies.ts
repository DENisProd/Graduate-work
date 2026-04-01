// Strategy pattern for snapping

import type { Point, Wall } from './types';
import { PointVO, WallVO } from './value-objects';

export interface SnapStrategy {
  snap(point: Point, walls: Wall[]): Point;
}

export class WallSnapStrategy implements SnapStrategy {
  constructor(private snapDistance: number = 10) {}

  snap(point: Point, walls: Wall[]): Point {
    if (walls.length === 0) return point;

    const pointVO = new PointVO(point.x, point.y);
    let closestPoint: PointVO | null = null;
    let minDistance = Infinity;

    for (const wall of walls) {
      const wallVO = new WallVO(
        new PointVO(wall.a.x, wall.a.y),
        new PointVO(wall.b.x, wall.b.y),
        wall.thickness
      );

      if (wallVO.isPointNear(pointVO, this.snapDistance)) {
        const snapped = wallVO.closestPoint(pointVO);
        const distance = pointVO.distanceTo(snapped);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = snapped;
        }
      }
    }

    return closestPoint ? closestPoint.toJSON() : point;
  }
}

export class GridSnapStrategy implements SnapStrategy {
  constructor(private gridSize: number = 10) {}

  snap(point: Point, _walls: Wall[]): Point {
    return {
      x: Math.round(point.x / this.gridSize) * this.gridSize,
      y: Math.round(point.y / this.gridSize) * this.gridSize,
    };
  }
}

export class FreeSnapStrategy implements SnapStrategy {
  snap(point: Point, _walls: Wall[]): Point {
    return point;
  }
}



