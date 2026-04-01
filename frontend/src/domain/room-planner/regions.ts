// Вычисление замкнутых контуров (регионов) по стенам

import type { Point, Wall } from './types';

const TOL = 2;

function pointKey(p: Point): string {
  return `${Math.round(p.x / TOL) * TOL},${Math.round(p.y / TOL) * TOL}`;
}

function pointEq(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < TOL && Math.abs(a.y - b.y) < TOL;
}

export interface ClosedLoop {
  polygon: Point[];
  wallIndices: number[];
  centroid: Point;
}

/**
 * Разбивает массив стен на замкнутые контуры (регионы).
 * Каждый контур — упорядоченный полигон и индексы стен.
 * Порядок регионов стабильный (по центроиду) для сохранения привязки к комнатам.
 */
export function getClosedLoops(walls: Wall[]): ClosedLoop[] {
  if (walls.length < 3) return [];

  // Граф: из каждой точки (key) — список рёбер { wallIndex, endPoint }
  const adj = new Map<string, Array<{ wallIndex: number; end: Point }>>();

  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    const keyA = pointKey(w.a);
    const keyB = pointKey(w.b);
    if (keyA === keyB) continue; // вырожденная стена

    if (!adj.has(keyA)) adj.set(keyA, []);
    adj.get(keyA)!.push({ wallIndex: i, end: w.b });
    if (!adj.has(keyB)) adj.set(keyB, []);
    adj.get(keyB)!.push({ wallIndex: i, end: w.a });
  }

  const used = new Set<number>();
  const loops: ClosedLoop[] = [];

  for (let startWallIdx = 0; startWallIdx < walls.length; startWallIdx++) {
    if (used.has(startWallIdx)) continue;

    const startWall = walls[startWallIdx];
    const path: Point[] = [startWall.a, startWall.b];
    const wallIndices: number[] = [startWallIdx];
    used.add(startWallIdx);

    let current = startWall.b;
    let steps = 0;
    const maxSteps = walls.length + 1;

    while (steps < maxSteps) {
      if (pointEq(current, startWall.a)) {
        // Замкнулись — регион найден
        const polygon = path.slice(0, -1);
        const centroid = getCentroid(polygon);
        loops.push({ polygon, wallIndices: [...wallIndices], centroid });
        break;
      }

      const key = pointKey(current);
      const neighbors = adj.get(key) || [];
      let nextWallIdx: number | null = null;
      let nextPoint: Point | null = null;

      for (const { wallIndex, end } of neighbors) {
        if (used.has(wallIndex)) continue;
        nextWallIdx = wallIndex;
        nextPoint = end;
        break;
      }

      if (nextWallIdx == null || nextPoint == null) break;

      path.push(nextPoint);
      wallIndices.push(nextWallIdx);
      used.add(nextWallIdx);
      current = nextPoint;
      steps++;
    }
  }

  // Стабильный порядок по центроиду (сначала по x, потом по y)
  loops.sort((a, b) => {
    const dx = a.centroid.x - b.centroid.x;
    if (Math.abs(dx) > TOL) return dx;
    return a.centroid.y - b.centroid.y;
  });

  return loops;
}

function getCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}
