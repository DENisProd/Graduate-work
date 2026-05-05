// Command pattern for undo/redo

import type { Point, DeviceType, DeviceAnchor } from './types';
import { RoomEntity } from './entities';

export interface Command {
  execute(room: RoomEntity): RoomEntity;
  undo(room: RoomEntity): RoomEntity;
}

export class AddWallPointCommand implements Command {
  constructor(private point: Point) {}

  execute(room: RoomEntity): RoomEntity {
    const walls = room.walls;
    if (walls.length === 0) {
      // First point - just store it
      return room;
    }
    // Add new wall segment
    const lastPoint = walls[walls.length - 1].b;
    const newWall = {
      a: lastPoint,
      b: this.point,
      thickness: 100, // Default thickness
    };
    return room.addWall(newWall);
  }

  undo(room: RoomEntity): RoomEntity {
    // Remove last wall
    if (room.walls.length === 0) return room;
    return new RoomEntity(
      room.walls.slice(0, -1),
      room.devices
    );
  }
}

export class CloseWallCommand implements Command {
  execute(room: RoomEntity): RoomEntity {
    if (room.walls.length < 2) return room;
    const firstPoint = room.walls[0].a;
    const lastPoint = room.walls[room.walls.length - 1].b;
    const closingWall = {
      a: lastPoint,
      b: firstPoint,
      thickness: 100,
    };
    return room.addWall(closingWall);
  }

  undo(room: RoomEntity): RoomEntity {
    if (room.walls.length === 0) return room;
    return new RoomEntity(
      room.walls.slice(0, -1),
      room.devices
    );
  }
}

export class AddDeviceCommand implements Command {
  constructor(
    private deviceId: string,
    private type: DeviceType,
    private position: Point,
    private anchor: DeviceAnchor
  ) {}

  execute(room: RoomEntity): RoomEntity {
    const device = {
      id: this.deviceId,
      type: this.type,
      position: this.position,
      anchor: this.anchor,
    };
    return room.addDevice(device);
  }

  undo(room: RoomEntity): RoomEntity {
    return room.removeDevice(this.deviceId);
  }
}

export class RemoveDeviceCommand implements Command {
  private device?: import('./types').Device;

  constructor(private deviceId: string) {}

  execute(room: RoomEntity): RoomEntity {
    this.device = room.devices.find((d) => d.id === this.deviceId);
    return room.removeDevice(this.deviceId);
  }

  undo(room: RoomEntity): RoomEntity {
    if (!this.device) return room;
    return room.addDevice(this.device);
  }
}

export class MoveDeviceCommand implements Command {
  private previousPosition?: Point;

  constructor(
    private deviceId: string,
    private newPosition: Point
  ) {}

  execute(room: RoomEntity): RoomEntity {
    const device = room.devices.find((d) => d.id === this.deviceId);
    if (!device) return room;
    this.previousPosition = device.position;
    return room.updateDevice(this.deviceId, { position: this.newPosition });
  }

  undo(room: RoomEntity): RoomEntity {
    if (!this.previousPosition) return room;
    return room.updateDevice(this.deviceId, { position: this.previousPosition });
  }
}



