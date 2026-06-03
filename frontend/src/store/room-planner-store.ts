import { create } from 'zustand';
import type {
  RoomEntity,
  ProjectMode,
  DeviceCatalog,
  DeviceType,
  Point,
  DeviceAnchor,
  ProjectSnapshot,
  ProjectExport,
  Door,
  Window,
} from '@/domain/room-planner';
import {
  CreateProjectUseCase,
  AddWallPointUseCase,
  MoveWallPointUseCase,
  RemoveWallUseCase,
  CloseRoomUseCase,
  AddDeviceUseCase,
  RemoveDeviceUseCase,
  MoveDeviceUseCase,
  ExportProjectUseCase,
  CreateSnapshotUseCase,
  RestoreSnapshotUseCase,
} from '@/application/room-planner';
import type { Command, RoomRegion } from '@/domain/room-planner';
import { debouncedAutosave, LocalStorageService } from '@/infrastructure/room-planner/storage';

const MAX_HISTORY = 20;

interface RoomPlannerState {
  houseId: string | null;
  room: RoomEntity;
  catalog: DeviceCatalog;
  history: ProjectSnapshot[];
  historyIndex: number;
  mode: ProjectMode;
  wallEditMode: 'draw' | 'connect';
  zoom: number;
  selectedDeviceId: string | null;
  selectedDoorId: string | null;
  selectedWindowId: string | null;
  selectedWallId: string | null;
  selectedWallPoint: Point | null;
  selectedWallPointIndex: number | null;
  pendingDeviceType: DeviceType | null;
  pendingWallStart: Point | null;
  showMeasurements: boolean;
  showGrid: boolean;
  roomRegions: RoomRegion[];
  pendingRegionPoints: Point[];
  selectedRegionId: string | null;
  selectedRegionPointIndex: number | null;

  addRoomRegionPoint: (point: Point) => void;
  closeRoomRegion: () => void;
  cancelRoomRegion: () => void;
  setRegionAssignment: (regionId: string, houseRoomId: number | string | null) => void;
  removeRoomRegion: (regionId: string) => void;
  selectRegion: (regionId: string | null) => void;
  setSelectedRegionPointIndex: (index: number | null) => void;
  moveRegionPoint: (regionId: string, pointIndex: number, newPosition: Point, save?: boolean) => void;
  addRegionPoint: (regionId: string, afterIndex: number, position: Point) => void;
  removeRegionPoint: (regionId: string, pointIndex: number) => void;
  initialize: (houseId: string) => void;
  execute: (command: Command) => void;
  addWallPoint: (point: Point, fromPoint?: Point) => void;
  setPendingWallStart: (point: Point | null) => void;
  setWallEditMode: (mode: 'draw' | 'connect') => void;
  setSelectedWallPoint: (point: Point | null) => void;
  setSelectedWallPointIndex: (index: number | null) => void;
  moveWallPoint: (pointIndex: number, newPosition: Point) => void;
  removeWall: (wallIndex: number) => void;
  setShowMeasurements: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  addDoor: (door: Door) => void;
  addWindow: (window: Window) => void;
  removeDoor: (doorId: string) => void;
  removeWindow: (windowId: string) => void;
  updateDoor: (doorId: string, updates: Partial<Door>) => void;
  updateWindow: (windowId: string, updates: Partial<Window>) => void;
  selectDoor: (doorId: string | null) => void;
  selectWindow: (windowId: string | null) => void;
  selectWall: (wallId: string | null) => void;
  setPendingDeviceType: (type: DeviceType | null) => void;
  closeRoom: () => void;
  addDevice: (type: DeviceType, position: Point, anchor?: DeviceAnchor) => void;
  removeDevice: (deviceId: string) => void;
  moveDevice: (deviceId: string, position: Point) => void;
  undo: () => void;
  redo: () => void;
  setMode: (mode: ProjectMode) => void;
  setZoom: (zoom: number) => void;
  selectDevice: (deviceId: string | null) => void;
  exportProject: () => ProjectExport;
  reset: () => void;
  loadFromSnapshot: (snapshot: ProjectSnapshot) => void;
  saveSnapshot: () => void;
  saveDevicePosition: (deviceId: string) => void;
}

const defaultCatalog: DeviceCatalog = {
  items: [
    {
      type: 'socket',
      name: 'Розетка',
      icon: '🔌',
      description: 'Электрическая розетка',
    },
    {
      type: 'switch',
      name: 'Выключатель',
      icon: '🔘',
      description: 'Выключатель света',
    },
    {
      type: 'motion-sensor',
      name: 'Датчик движения',
      icon: '👁️',
      description: 'Датчик обнаружения движения',
    },
    {
      type: 'temperature-sensor',
      name: 'Датчик температуры',
      icon: '🌡️',
      description: 'Датчик температуры воздуха',
    },
    {
      type: 'camera',
      name: 'Камера',
      icon: '📹',
      description: 'Видеокамера наблюдения',
    },
    {
      type: 'dimmer',
      name: 'Диммер',
      icon: '💡',
      description: 'Регулятор яркости света',
    },
  ],
};

const createProjectUseCase = new CreateProjectUseCase();
const addWallPointUseCase = new AddWallPointUseCase();
const moveWallPointUseCase = new MoveWallPointUseCase();
const removeWallUseCase = new RemoveWallUseCase();
const closeRoomUseCase = new CloseRoomUseCase();
const addDeviceUseCase = new AddDeviceUseCase();
const removeDeviceUseCase = new RemoveDeviceUseCase();
const moveDeviceUseCase = new MoveDeviceUseCase();
const exportProjectUseCase = new ExportProjectUseCase();
const createSnapshotUseCase = new CreateSnapshotUseCase();
const restoreSnapshotUseCase = new RestoreSnapshotUseCase();

export const useRoomPlannerStore = create<RoomPlannerState>((set, get) => ({
  houseId: null,
  room: createProjectUseCase.execute(),
  catalog: defaultCatalog,
  history: [],
  historyIndex: -1,
  mode: 'walls',
  wallEditMode: 'draw',
  zoom: 100,
  selectedDeviceId: null,
  selectedDoorId: null,
  selectedWindowId: null,
  selectedWallId: null,
  selectedWallPoint: null,
  selectedWallPointIndex: null,
  pendingDeviceType: null,
  pendingWallStart: null,
  showMeasurements: true,
  showGrid: true,
  roomRegions: [],
  pendingRegionPoints: [],
  selectedRegionId: null,
  selectedRegionPointIndex: null,

  initialize: (houseId: string) => {
    const state = get();
    set({ houseId });
    const saved = LocalStorageService.load(houseId);
    if (saved) {
      state.loadFromSnapshot(saved);
    } else {
      const newRoom = createProjectUseCase.execute();
      set({
        room: newRoom,
        history: [],
        historyIndex: -1,
        mode: 'walls',
        wallEditMode: 'draw',
        zoom: 100,
        selectedDeviceId: null,
        selectedDoorId: null,
        selectedWindowId: null,
        selectedWallId: null,
        selectedWallPoint: null,
        selectedWallPointIndex: null,
        pendingDeviceType: null,
        pendingWallStart: null,
        roomRegions: [],
        pendingRegionPoints: [],
        selectedRegionId: null,
      });
    }
  },

  execute: (command: Command) => {
    const state = get();
    const newRoom = command.execute(state.room);
    set({ room: newRoom });
    state.saveSnapshot();
  },

  addWallPoint: (point: Point, fromPoint?: Point) => {
    const state = get();
    console.log('[addWallPoint] Called with:', { point, fromPoint, currentPendingWallStart: state.pendingWallStart });

    if (fromPoint) {
      console.log('[addWallPoint] Connect mode - creating wall from fromPoint');
      const newRoom = addWallPointUseCase.execute(state.room, point, fromPoint);
      set({ room: newRoom, selectedWallPoint: null, pendingWallStart: null });
      console.log('[addWallPoint] Connect mode - cleared pendingWallStart');
      state.saveSnapshot();
      return;
    }

    if (state.pendingWallStart) {
      console.log('[addWallPoint] Has pendingWallStart, creating wall');
      const distance = Math.sqrt(
        Math.pow(point.x - state.pendingWallStart.x, 2) + Math.pow(point.y - state.pendingWallStart.y, 2)
      );
      if (distance < 1) {
        console.log('[addWallPoint] Clicking on same point, ignoring');
        return;
      }

      const newRoom = addWallPointUseCase.execute(state.room, point, state.pendingWallStart);
      console.log('[addWallPoint] Wall created, clearing pendingWallStart');
      // CRITICAL: Always clear pendingWallStart after creating a wall — no automatic chaining.
      // Each wall requires an explicit start point selection.
      set({ pendingWallStart: null, room: newRoom });
      console.log('[addWallPoint] Room updated, pendingWallStart cleared');
      state.saveSnapshot();
      const finalState = get();
      console.log('[addWallPoint] Final state check - pendingWallStart:', finalState.pendingWallStart);
      if (finalState.pendingWallStart !== null) {
        console.log('[addWallPoint] WARNING: pendingWallStart is not null after wall creation! Clearing again...');
        set({ pendingWallStart: null });
      }
      console.log('[addWallPoint] Wall creation complete, pendingWallStart should be null');
      return;
    }

    const currentState = get();
    if (currentState.pendingWallStart === null) {
      console.log('[addWallPoint] No pendingWallStart, setting new start point:', point);
      set({ pendingWallStart: point });
      const afterSet = get();
      console.log('[addWallPoint] After setting pendingWallStart:', afterSet.pendingWallStart);
    } else {
      console.log('[addWallPoint] pendingWallStart already set, ignoring this call (possible double-click)');
    }
  },

  setPendingWallStart: (point: Point | null) => {
    console.log('[setPendingWallStart] Called with:', point);
    set({ pendingWallStart: point });
    const afterSet = get();
    console.log('[setPendingWallStart] After set:', afterSet.pendingWallStart);
  },

  setWallEditMode: (mode: 'draw' | 'connect') => {
    set({ wallEditMode: mode, selectedWallPoint: null });
  },

  setSelectedWallPoint: (point: Point | null) => {
    set({ selectedWallPoint: point });
  },

  addDoor: (door: Door) => {
    const state = get();
    const newRoom = state.room.addDoor(door);
    set({ room: newRoom });
    state.saveSnapshot();
  },

  removeDoor: (doorId: string) => {
    const state = get();
    const newRoom = state.room.removeDoor(doorId);
    set({ room: newRoom, selectedDoorId: state.selectedDoorId === doorId ? null : state.selectedDoorId });
    state.saveSnapshot();
  },

  addWindow: (window: Window) => {
    const state = get();
    const newRoom = state.room.addWindow(window);
    set({ room: newRoom });
    state.saveSnapshot();
  },

  removeWindow: (windowId: string) => {
    const state = get();
    const newRoom = state.room.removeWindow(windowId);
    set({ room: newRoom, selectedWindowId: state.selectedWindowId === windowId ? null : state.selectedWindowId });
    state.saveSnapshot();
  },

  updateDoor: (doorId: string, updates: Partial<Door>) => {
    const state = get();
    const newRoom = state.room.updateDoor(doorId, updates);
    set({ room: newRoom });
    state.saveSnapshot();
  },

  updateWindow: (windowId: string, updates: Partial<Window>) => {
    const state = get();
    const newRoom = state.room.updateWindow(windowId, updates);
    set({ room: newRoom });
    state.saveSnapshot();
  },

  selectDoor: (doorId: string | null) => {
    set({ selectedDoorId: doorId, selectedWindowId: null, selectedDeviceId: null, selectedWallId: null });
  },

  selectWindow: (windowId: string | null) => {
    set({ selectedWindowId: windowId, selectedDoorId: null, selectedDeviceId: null, selectedWallId: null });
  },

  selectWall: (wallId: string | null) => {
    set({ selectedWallId: wallId, selectedDoorId: null, selectedWindowId: null, selectedDeviceId: null });
  },

  setPendingDeviceType: (type: DeviceType | null) => {
    set({ pendingDeviceType: type });
  },

  setSelectedWallPointIndex: (index: number | null) => {
    set({ selectedWallPointIndex: index });
  },

  moveWallPoint: (pointIndex: number, newPosition: Point) => {
    const state = get();
    const newRoom = moveWallPointUseCase.execute(state.room, pointIndex, newPosition);
    set({ room: newRoom });
    state.saveSnapshot();
  },

  removeWall: (wallIndex: number) => {
    const state = get();
    const wall = state.room.walls[wallIndex];
    const newRoom = removeWallUseCase.execute(state.room, wallIndex);
    set({
      room: newRoom,
      selectedWallId: state.selectedWallId === wall?.id ? null : state.selectedWallId
    });
    state.saveSnapshot();
  },

  setShowMeasurements: (show: boolean) => {
    set({ showMeasurements: show });
  },

  setShowGrid: (show: boolean) => {
    set({ showGrid: show });
  },

  closeRoom: () => {
    const state = get();
    const newRoom = closeRoomUseCase.execute(state.room);
    set({ room: newRoom, mode: 'devices' });
    state.saveSnapshot();
  },

  addDevice: (type: DeviceType, position: Point, anchor: DeviceAnchor = 'free') => {
    const state = get();
    const newRoom = addDeviceUseCase.execute(state.room, type, position, anchor);
    set({ room: newRoom });
    state.saveSnapshot();
  },

  removeDevice: (deviceId: string) => {
    const state = get();
    const newRoom = removeDeviceUseCase.execute(state.room, deviceId);
    set({ room: newRoom, selectedDeviceId: null });
    state.saveSnapshot();
  },

  moveDevice: (deviceId: string, position: Point) => {
    const state = get();
    const newRoom = moveDeviceUseCase.execute(state.room, deviceId, position);
    set({ room: newRoom });
    // Don't save snapshot on every move — only on drag end
  },

  saveDevicePosition: (deviceId: string) => {
    const state = get();
    if (deviceId) {
      state.saveSnapshot();
      return;
    }
    state.saveSnapshot();
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const snapshot = state.history[newIndex];
      const restoredRoom = restoreSnapshotUseCase.execute(snapshot);
      set({
        room: restoredRoom,
        historyIndex: newIndex,
        roomRegions: snapshot.roomRegions ?? [],
        pendingRegionPoints: [],
        selectedRegionId: null,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      const snapshot = state.history[newIndex];
      const restoredRoom = restoreSnapshotUseCase.execute(snapshot);
      set({
        room: restoredRoom,
        historyIndex: newIndex,
        roomRegions: snapshot.roomRegions ?? [],
        pendingRegionPoints: [],
        selectedRegionId: null,
      });
    }
  },

  setMode: (mode: ProjectMode) => {
    const state = get();
    if (mode === 'walls' && state.mode !== 'walls') {
      set({ mode, pendingWallStart: null });
    } else if (mode === 'rooms') {
      set({ mode, pendingWallStart: null, pendingDeviceType: null });
    } else if ((state.mode as ProjectMode) === 'rooms') {
      set({ mode, pendingRegionPoints: [], selectedRegionId: null, selectedRegionPointIndex: null });
    } else {
      set({ mode });
    }
  },

  setZoom: (zoom: number) => {
    set({ zoom: Math.max(50, Math.min(200, zoom)) });
  },

  selectDevice: (deviceId: string | null) => {
    set({ selectedDeviceId: deviceId, selectedDoorId: null, selectedWindowId: null, selectedWallId: null, selectedRegionId: null });
  },

  addRoomRegionPoint: (point: Point) => {
    set((s) => ({ pendingRegionPoints: [...s.pendingRegionPoints, point] }));
  },
  closeRoomRegion: () => {
    const state = get();
    if (state.pendingRegionPoints.length < 3) return;
    const id = `region_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newRegion: RoomRegion = {
      id,
      points: [...state.pendingRegionPoints],
      houseRoomId: null,
    };
    set({
      roomRegions: [...state.roomRegions, newRegion],
      pendingRegionPoints: [],
      selectedRegionId: id,
    });
    state.saveSnapshot();
  },
  cancelRoomRegion: () => {
    set({ pendingRegionPoints: [], selectedRegionId: null });
  },
  setRegionAssignment: (regionId: string, houseRoomId: number | string | null) => {
    const state = get();
    const next = state.roomRegions.map((r) =>
      r.id === regionId ? { ...r, houseRoomId } : r
    );
    set({ roomRegions: next });
    state.saveSnapshot();
  },
  removeRoomRegion: (regionId: string) => {
    const state = get();
    set({
      roomRegions: state.roomRegions.filter((r) => r.id !== regionId),
      selectedRegionId: state.selectedRegionId === regionId ? null : state.selectedRegionId,
    });
    state.saveSnapshot();
  },
  selectRegion: (regionId: string | null) => {
    set({ selectedRegionId: regionId, selectedRegionPointIndex: null });
  },
  setSelectedRegionPointIndex: (index: number | null) => {
    set({ selectedRegionPointIndex: index });
  },
  moveRegionPoint: (regionId: string, pointIndex: number, newPosition: Point, save = true) => {
    const state = get();
    const region = state.roomRegions.find((r) => r.id === regionId);
    if (!region || pointIndex < 0 || pointIndex >= region.points.length) return;
    const nextPoints = [...region.points];
    nextPoints[pointIndex] = newPosition;
    set({
      roomRegions: state.roomRegions.map((r) =>
        r.id === regionId ? { ...r, points: nextPoints } : r
      ),
    });
    if (save) state.saveSnapshot();
  },
  addRegionPoint: (regionId: string, afterIndex: number, position: Point) => {
    const state = get();
    const region = state.roomRegions.find((r) => r.id === regionId);
    if (!region || afterIndex < 0 || afterIndex >= region.points.length) return;
    const nextPoints = [
      ...region.points.slice(0, afterIndex + 1),
      position,
      ...region.points.slice(afterIndex + 1),
    ];
    set({
      roomRegions: state.roomRegions.map((r) =>
        r.id === regionId ? { ...r, points: nextPoints } : r
      ),
      selectedRegionPointIndex: afterIndex + 1,
    });
    state.saveSnapshot();
  },
  removeRegionPoint: (regionId: string, pointIndex: number) => {
    const state = get();
    const region = state.roomRegions.find((r) => r.id === regionId);
    if (!region || region.points.length <= 3) return;
    const nextPoints = region.points.filter((_, i) => i !== pointIndex);
    set({
      roomRegions: state.roomRegions.map((r) =>
        r.id === regionId ? { ...r, points: nextPoints } : r
      ),
      selectedRegionPointIndex: null,
    });
    state.saveSnapshot();
  },

  exportProject: () => {
    const state = get();
    return exportProjectUseCase.execute(state.room);
  },

  reset: () => {
    const state = get();
    const newRoom = createProjectUseCase.execute();
    set({
      room: newRoom,
      history: [],
      historyIndex: -1,
      mode: 'walls',
      wallEditMode: 'draw',
      zoom: 100,
      selectedDeviceId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      selectedWallId: null,
      selectedWallPoint: null,
      selectedWallPointIndex: null,
      pendingDeviceType: null,
      pendingWallStart: null,
      showMeasurements: true,
      roomRegions: [],
      pendingRegionPoints: [],
      selectedRegionId: null,
      selectedRegionPointIndex: null,
    });
    if (state.houseId) LocalStorageService.remove(state.houseId);
  },

  loadFromSnapshot: (snapshot: ProjectSnapshot) => {
    const restoredRoom = restoreSnapshotUseCase.execute(snapshot);
    set({
      room: restoredRoom,
      roomRegions: snapshot.roomRegions ?? [],
      pendingRegionPoints: [],
      selectedRegionId: null,
      selectedRegionPointIndex: null,
    });
  },

  saveSnapshot: () => {
    const state = get();
    const snapshot = createSnapshotUseCase.execute(state.room);
    snapshot.roomRegions = state.roomRegions ?? [];

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);

    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    const { houseId } = get();
    if (houseId) debouncedAutosave(houseId, snapshot);
  },
}));
