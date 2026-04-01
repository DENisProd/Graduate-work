// Domain types for Room Planner

export type Point = {
  x: number;
  y: number;
};

export type Wall = {
  a: Point;
  b: Point;
  thickness: number;
  id?: string;
};

export type Door = {
  id: string;
  wallId: string;
  position: number; // Position along wall (0-1)
  width: number;
  direction: 'left' | 'right' | 'both';
  name?: string; // Friendly name like "Дверь #1"
};

export type Window = {
  id: string;
  wallId: string;
  position: number; // Position along wall (0-1)
  width: number;
  name?: string; // Friendly name like "Окно #1"
};

export type DeviceType =
  | 'socket'
  | 'switch'
  | 'motion-sensor'
  | 'temperature-sensor'
  | 'camera'
  | 'dimmer';

export type DeviceAnchor = 'wall' | 'free';

export type Device = {
  id: string;
  type: DeviceType;
  position: Point;
  anchor: DeviceAnchor;
  metadata?: Record<string, unknown>;
};

export type Room = {
  walls: Wall[];
  devices: Device[];
  doors: Door[];
  windows: Window[];
};

/** Область комнаты на плане — произвольный полигон (не привязан к стенам) */
export type RoomRegion = {
  id: string;
  /** Вершины полигона (замкнутый: последняя соединяется с первой) */
  points: Point[];
  /** id комнаты дома (HouseRoom) или null */
  houseRoomId: number | string | null;
};

export type ProjectSnapshot = {
  room: Room;
  timestamp: number;
  /** Области комнат — рисуются инструментом «Разметка комнат» */
  roomRegions?: RoomRegion[];
};

export type DeviceCatalogItem = {
  type: DeviceType;
  name: string;
  icon: string;
  description?: string;
};

export type DeviceCatalog = {
  items: DeviceCatalogItem[];
};

export type ProjectMode = 'walls' | 'devices' | 'select' | 'doors' | 'windows' | 'pan' | 'rooms';
export type WallEditMode = 'draw' | 'connect'; // draw - новый контур, connect - продолжение от точки

export type ProjectExport = {
  version: number;
  timestamp: string;
  room: Room;
};

