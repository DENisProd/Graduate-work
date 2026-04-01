// Application use cases

import type {
  Room,
  DeviceType,
  Point,
  DeviceAnchor,
  ProjectExport,
  ProjectSnapshot,
} from '@/domain/room-planner';
import { RoomEntity } from '@/domain/room-planner';
import { DeviceFactory } from '@/domain/room-planner';
import { WallSnapStrategy } from '@/domain/room-planner';

export class CreateProjectUseCase {
  execute(): RoomEntity {
    return new RoomEntity([], [], [], []);
  }
}

export class AddWallPointUseCase {
  execute(room: RoomEntity, point: Point, fromPoint?: Point): RoomEntity {
    const walls = room.walls;
    
    // If fromPoint is provided, start from that point (connect mode)
    if (fromPoint) {
      const newWall = {
        a: fromPoint,
        b: point,
        thickness: 20,
        id: `wall_${Date.now()}_${Math.random()}`,
      };
      return room.addWall(newWall);
    }
    
    if (walls.length === 0) {
      // First point - create a wall with same start and end
      return room.addWall({
        a: point,
        b: point,
        thickness: 20,
        id: `wall_${Date.now()}_${Math.random()}`,
      });
    }
    // Add new wall segment
    const lastPoint = walls[walls.length - 1].b;
    const newWall = {
      a: lastPoint,
      b: point,
      thickness: 20,
      id: `wall_${Date.now()}_${Math.random()}`,
    };
    return room.addWall(newWall);
  }
}

export class MoveWallPointUseCase {
  execute(room: RoomEntity, pointIndex: number, newPosition: Point): RoomEntity {
    return room.updateWallPoint(pointIndex, newPosition);
  }
}

export class RemoveWallUseCase {
  execute(room: RoomEntity, wallIndex: number): RoomEntity {
    return room.removeWall(wallIndex);
  }
}

export class CloseRoomUseCase {
  execute(room: RoomEntity): RoomEntity {
    if (room.walls.length < 2) return room;
    const firstPoint = room.walls[0].a;
    const lastPoint = room.walls[room.walls.length - 1].b;
    
    // Check if already closed
    if (
      Math.abs(firstPoint.x - lastPoint.x) < 1 &&
      Math.abs(firstPoint.y - lastPoint.y) < 1
    ) {
      return room;
    }

    const closingWall = {
      a: lastPoint,
      b: firstPoint,
      thickness: 20,
      id: `wall_${Date.now()}_${Math.random()}`,
    };
    return room.addWall(closingWall);
  }
}

export class AddDeviceUseCase {
  private snapStrategy = new WallSnapStrategy(10);

  execute(
    room: RoomEntity,
    type: DeviceType,
    position: Point,
    anchor: DeviceAnchor = 'free'
  ): RoomEntity {
    // Snap to wall if anchor is 'wall'
    const finalPosition =
      anchor === 'wall' ? this.snapStrategy.snap(position, room.walls) : position;

    const device = DeviceFactory.create(type, finalPosition, anchor);
    return room.addDevice({
      id: device.id,
      type: device.type,
      position: device.position,
      anchor: device.anchor,
      metadata: device.metadata,
    });
  }
}

export class RemoveDeviceUseCase {
  execute(room: RoomEntity, deviceId: string): RoomEntity {
    return room.removeDevice(deviceId);
  }
}

export class MoveDeviceUseCase {
  private snapStrategy = new WallSnapStrategy(10);

  execute(
    room: RoomEntity,
    deviceId: string,
    newPosition: Point
  ): RoomEntity {
    const device = room.devices.find((d) => d.id === deviceId);
    if (!device) return room;

    // Snap to wall if anchor is 'wall'
    const finalPosition =
      device.anchor === 'wall'
        ? this.snapStrategy.snap(newPosition, room.walls)
        : newPosition;

    return room.updateDevice(deviceId, { position: finalPosition });
  }
}

export class ExportProjectUseCase {
  execute(room: RoomEntity): ProjectExport {
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      room: {
        walls: room.walls,
        devices: room.devices,
        doors: room.doors,
        windows: room.windows,
      },
    };
  }
}

export class CreateSnapshotUseCase {
  execute(room: RoomEntity): ProjectSnapshot {
    return {
      room: {
        walls: room.walls,
        devices: room.devices,
        doors: room.doors,
        windows: room.windows,
      },
      timestamp: Date.now(),
    };
  }
}

export class RestoreSnapshotUseCase {
  execute(snapshot: ProjectSnapshot): RoomEntity {
    return new RoomEntity(
      snapshot.room.walls,
      snapshot.room.devices,
      snapshot.room.doors || [],
      snapshot.room.windows || []
    );
  }
}
