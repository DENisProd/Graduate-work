

import type { ProjectSnapshot } from '@/domain/room-planner';

const STORAGE_KEY_PREFIX = 'room-planner-project';
const AUTOSAVE_INTERVAL = 5000;

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

const autosaveTimers: Record<string, NodeJS.Timeout> = {};

export function debouncedAutosave(houseId: string, snapshot: ProjectSnapshot): void {
  if (autosaveTimers[houseId]) {
    clearTimeout(autosaveTimers[houseId]);
  }
  autosaveTimers[houseId] = setTimeout(() => {
    LocalStorageService.save(houseId, snapshot);
    delete autosaveTimers[houseId];
  }, AUTOSAVE_INTERVAL);
}



