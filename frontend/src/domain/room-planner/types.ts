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
  position: number;
  width: number;
  direction: 'left' | 'right' | 'both';
  name?: string;
};

export type Window = {
  id: string;
  wallId: string;
  position: number;
  width: number;
  name?: string;
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

export type PendingDevicePlacement = {
  physicalDeviceId: string;
  type: DeviceType;
  name?: string | null;
};

export type Room = {
  walls: Wall[];
  devices: Device[];
  doors: Door[];
  windows: Window[];
};

export type RoomRegion = {
  id: string;
  points: Point[];
  houseRoomId: number | string | null;
};

export type ProjectSnapshot = {
  room: Room;
  timestamp: number;
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
export type WallEditMode = 'draw' | 'connect';

export type ProjectExport = {
  version: number;
  timestamp: string;
  room: Room;
};

