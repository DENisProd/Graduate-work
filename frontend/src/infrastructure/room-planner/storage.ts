
import type { ProjectSnapshot } from '@/domain/room-planner';
import { houseFloorPlansApi } from '@/lib/api/scenario-service';
import { ApiError } from '@/lib/api/core';
import type { HouseFloorPlanSnapshot } from '@/types/api';

const STORAGE_KEY_PREFIX = 'room-planner-project';

/** Interval for periodic autosave (3 minutes). */
export const AUTOSAVE_INTERVAL_MS = 3 * 60 * 1000;

function getStorageKey(houseId: string): string {
  return `${STORAGE_KEY_PREFIX}-${houseId}`;
}

export class LocalStorageService {
  static save(houseId: string, snapshot: ProjectSnapshot): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(getStorageKey(houseId), JSON.stringify(snapshot));
    } catch (error) {
      console.error('Failed to save project to localStorage:', error);
    }
  }

  static load(houseId: string): ProjectSnapshot | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(getStorageKey(houseId));
      if (!saved) return null;
      return JSON.parse(saved) as ProjectSnapshot;
    } catch (error) {
      console.error('Failed to load project from localStorage:', error);
      return null;
    }
  }

  static remove(houseId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(getStorageKey(houseId));
    } catch (error) {
      console.error('Failed to remove project from localStorage:', error);
    }
  }
}

function toApiSnapshot(snapshot: ProjectSnapshot): HouseFloorPlanSnapshot {
  return snapshot as unknown as HouseFloorPlanSnapshot;
}

function fromApiSnapshot(snapshot: HouseFloorPlanSnapshot): ProjectSnapshot {
  return snapshot as unknown as ProjectSnapshot;
}

export async function loadProjectFromServer(
  houseId: string,
): Promise<{ snapshot: ProjectSnapshot; version: number } | null> {
  try {
    const plan = await houseFloorPlansApi.get(houseId);
    const snapshot = fromApiSnapshot(plan.snapshot);
    LocalStorageService.save(houseId, snapshot);
    return { snapshot, version: plan.version };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveProjectToServer(
  houseId: string,
  snapshot: ProjectSnapshot,
  version?: number,
): Promise<{ version: number }> {
  const response = await houseFloorPlansApi.upsert(houseId, {
    snapshot: toApiSnapshot(snapshot),
    version,
  });
  LocalStorageService.save(houseId, snapshot);
  return { version: response.version };
}

export async function deleteProjectFromServer(houseId: string): Promise<void> {
  try {
    await houseFloorPlansApi.delete(houseId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      LocalStorageService.remove(houseId);
      return;
    }
    throw error;
  }
  LocalStorageService.remove(houseId);
}

export function saveProjectSnapshot(houseId: string, snapshot: ProjectSnapshot): void {
  LocalStorageService.save(houseId, snapshot);
}
