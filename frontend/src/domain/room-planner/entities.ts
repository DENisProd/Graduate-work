

import type { Point, Wall, Device, Room, DeviceType, DeviceAnchor, Door, Window } from './types';

export class RoomEntity {
  constructor(
    public walls: Wall[],
    public devices: Device[],
    public doors: Door[] = [],
    public windows: Window[] = []
  ) {}

  addWall(wall: Wall): RoomEntity {
    const wallWithId = { ...wall, id: wall.id || `wall_${Date.now()}_${Math.random()}` };
    return new RoomEntity([...this.walls, wallWithId], this.devices, this.doors, this.windows);
  }

  removeWall(wallIndex: number): RoomEntity {
    if (wallIndex < 0 || wallIndex >= this.walls.length) return this;
    const newWalls = [...this.walls];
    newWalls.splice(wallIndex, 1);
    const removedWall = this.walls[wallIndex];
    const wallId = removedWall.id;
    const newDoors = wallId ? this.doors.filter((d) => d.wallId !== wallId) : this.doors;
    const newWindows = wallId ? this.windows.filter((w) => w.wallId !== wallId) : this.windows;
    return new RoomEntity(newWalls, this.devices, newDoors, newWindows);
  }

  updateWallPoint(pointIndex: number, newPosition: Point): RoomEntity {
    const newWalls = [...this.walls];
    
    if (pointIndex === 0) {
      if (newWalls.length > 0) {
        newWalls[0] = { ...newWalls[0], a: newPosition };
      }
    } else if (pointIndex < newWalls.length) {
      newWalls[pointIndex - 1] = { ...newWalls[pointIndex - 1], b: newPosition };
      newWalls[pointIndex] = { ...newWalls[pointIndex], a: newPosition };
    } else if (pointIndex === newWalls.length) {
      newWalls[newWalls.length - 1] = { ...newWalls[newWalls.length - 1], b: newPosition };
    }
    
    return new RoomEntity(newWalls, this.devices, this.doors, this.windows);
  }

  addDevice(device: Device): RoomEntity {
    return new RoomEntity(this.walls, [...this.devices, device], this.doors, this.windows);
  }

  removeDevice(deviceId: string): RoomEntity {
    return new RoomEntity(
      this.walls,
      this.devices.filter((d) => d.id !== deviceId),
      this.doors,
      this.windows
    );
  }

  updateDevice(deviceId: string, updates: Partial<Device>): RoomEntity {
    return new RoomEntity(
      this.walls,
      this.devices.map((d) =>
        d.id === deviceId ? { ...d, ...updates } : d
      ),
      this.doors,
      this.windows
    );
  }

  addDoor(door: Door): RoomEntity {
    return new RoomEntity(this.walls, this.devices, [...this.doors, door], this.windows);
  }

  removeDoor(doorId: string): RoomEntity {
    return new RoomEntity(
      this.walls,
      this.devices,
      this.doors.filter((d) => d.id !== doorId),
      this.windows
    );
  }

  updateDoor(doorId: string, updates: Partial<Door>): RoomEntity {
    return new RoomEntity(
      this.walls,
      this.devices,
      this.doors.map((d) =>
        d.id === doorId ? { ...d, ...updates } : d
      ),
      this.windows
    );
  }

  addWindow(window: Window): RoomEntity {
    return new RoomEntity(this.walls, this.devices, this.doors, [...this.windows, window]);
  }

  removeWindow(windowId: string): RoomEntity {
    return new RoomEntity(
      this.walls,
      this.devices,
      this.doors,
      this.windows.filter((w) => w.id !== windowId)
    );
  }

  updateWindow(windowId: string, updates: Partial<Window>): RoomEntity {
    return new RoomEntity(
      this.walls,
      this.devices,
      this.doors,
      this.windows.map((w) =>
        w.id === windowId ? { ...w, ...updates } : w
      )
    );
  }

  isClosed(): boolean {
    if (this.walls.length < 3) return false;
    const firstPoint = this.walls[0].a;
    const lastPoint = this.walls[this.walls.length - 1].b;
    const distance = Math.sqrt(
      Math.pow(firstPoint.x - lastPoint.x, 2) + Math.pow(firstPoint.y - lastPoint.y, 2)
    );
    return distance < 10;
  }
}

export class DeviceEntity {
  constructor(
    public readonly id: string,
    public readonly type: DeviceType,
    public position: Point,
    public anchor: DeviceAnchor,
    public metadata?: Record<string, unknown>
  ) {}

  moveTo(newPosition: Point): DeviceEntity {
    return new DeviceEntity(
      this.id,
      this.type,
      newPosition,
      this.anchor,
      this.metadata
    );
  }

  updateAnchor(anchor: DeviceAnchor): DeviceEntity {
    return new DeviceEntity(
      this.id,
      this.type,
      this.position,
      anchor,
      this.metadata
    );
  }
}

