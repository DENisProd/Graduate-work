// Value Objects

import type { Point, Wall } from './types';

export class PointVO {
  constructor(public readonly x: number, public readonly y: number) {
    if (x < 0 || y < 0) {
      throw new Error('Point coordinates must be non-negative');
    }
  }

  equals(other: PointVO): boolean {
    return this.x === other.x && this.y === other.y;
  }

  distanceTo(other: PointVO): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  toJSON(): Point {
    return { x: this.x, y: this.y };
  }
}

export class WallVO {
  constructor(
    public readonly a: PointVO,
    public readonly b: PointVO,
    public readonly thickness: number
  ) {
    if (thickness <= 0) {
      throw new Error('Wall thickness must be positive');
    }
  }

  length(): number {
    return this.a.distanceTo(this.b);
  }

  // Find closest point on wall to a given point
  closestPoint(point: PointVO): PointVO {
    const ax = this.a.x;
    const ay = this.a.y;
    const bx = this.b.x;
    const by = this.b.y;
    const px = point.x;
    const py = point.y;

    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      return this.a;
    }

    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
    return new PointVO(ax + t * dx, ay + t * dy);
  }

  // Check if point is within snap distance (10px) of wall
  isPointNear(point: PointVO, snapDistance: number = 10): boolean {
    const closest = this.closestPoint(point);
    return closest.distanceTo(point) <= snapDistance;
  }

  toJSON(): Wall {
    return {
      a: this.a.toJSON(),
      b: this.b.toJSON(),
      thickness: this.thickness,
    };
  }
}



