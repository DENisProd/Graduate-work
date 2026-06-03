

import type { DeviceType, Point, DeviceAnchor } from './types';
import { DeviceEntity } from './entities';

export class DeviceFactory {
  private static idCounter = 0;

  static create(
    type: DeviceType,
    position: Point,
    anchor: DeviceAnchor = 'free'
  ): DeviceEntity {
    const id = `dev_${Date.now()}_${++this.idCounter}`;
    const metadata = this.getDefaultMetadata(type);
    return new DeviceEntity(id, type, position, anchor, metadata);
  }

  private static getDefaultMetadata(type: DeviceType): Record<string, unknown> {
    const baseMetadata = {
      createdAt: new Date().toISOString(),
    };

    switch (type) {
      case 'socket':
        return { ...baseMetadata, voltage: 220, amperage: 16 };
      case 'switch':
        return { ...baseMetadata, type: 'single' };
      case 'motion-sensor':
        return { ...baseMetadata, range: 5, angle: 120 };
      case 'temperature-sensor':
        return { ...baseMetadata, precision: 0.1 };
      case 'camera':
        return { ...baseMetadata, resolution: '1080p', angle: 90 };
      case 'dimmer':
        return { ...baseMetadata, minBrightness: 0, maxBrightness: 100 };
      default:
        return baseMetadata;
    }
  }
}



