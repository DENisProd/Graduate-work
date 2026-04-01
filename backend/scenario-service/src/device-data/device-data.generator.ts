import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import type { DeviceDataType } from '../common/schemas/enums';
import { PhysicalDeviceService } from '../devices/physical-device.service';
import { DeviceDataService } from './device-data.service';

@Injectable()
export class DeviceDataGeneratorService {
  private readonly logger = new Logger(DeviceDataGeneratorService.name);

  constructor(
    private readonly deviceDataService: DeviceDataService,
    private readonly physicalDeviceService: PhysicalDeviceService,
  ) {}

  @Interval(30_000)
  async generateRandomDataForDevices() {
    const devices = await this.getAllDevices();
    if (!devices.length) return;

    const timestamp = new Date();

    await Promise.all(
      devices.map((device) => {
        const payload = this.buildRandomPayload(
          device.deviceTypeId,
          device.id,
          timestamp,
        );
        return this.deviceDataService.create(payload);
      }),
    );
  }

  private async getAllDevices() {
    const limit = 100;
    let page = 0;
    const all: Array<{ id: string; deviceTypeId: number }> = [];

    // paginate through all devices to avoid loading too many at once
    // relies on PhysicalDeviceService pagination (0-based `page`)
    // stops when we've loaded at least "total" devices or page is empty
    for (;;) {
      const { items, total } = await this.physicalDeviceService.findMany({
        page,
        limit,
      });

      if (!items.length) break;

      all.push(
        ...items.map((item) => ({
          id: item.id,
          deviceTypeId: item.deviceTypeId,
        })),
      );

      if (all.length >= total) break;
      page += 1;
    }

    return all;
  }

  private buildRandomPayload(
    deviceTypeId: number | undefined,
    deviceId: string,
    timestamp: Date,
  ) {
    const types: DeviceDataType[] = ['FLOAT', 'NUMBER', 'STRING', 'BOOLEAN'];
    const type = types[Math.floor(Math.random() * types.length)];

    let unit: string | undefined;
    let data: Record<string, unknown>;

    switch (type) {
      case 'FLOAT': {
        unit = '°C';
        data = {
          value: this.randomFloat(18, 26),
        };
        break;
      }
      case 'NUMBER': {
        unit = 'W';
        data = {
          value: this.randomInt(0, 2000),
        };
        break;
      }
      case 'STRING': {
        unit = undefined;
        const states = ['idle', 'running', 'error'];
        data = {
          value: states[Math.floor(Math.random() * states.length)],
        };
        break;
      }
      case 'BOOLEAN':
      default: {
        unit = undefined;
        data = {
          value: Math.random() > 0.5,
        };
        break;
      }
    }

    const base: {
      deviceId?: string;
      deviceTypeId?: number;
      deviceFunction: string;
      type: DeviceDataType;
      unit?: string;
      timestamp: Date;
      data: Record<string, unknown>;
    } = {
      deviceFunction: 'random',
      type,
      unit,
      timestamp,
      data,
    };

    if (deviceId) {
      base.deviceId = deviceId;
    }

    if (typeof deviceTypeId === 'number') {
      base.deviceTypeId = deviceTypeId;
    }

    return base;
  }

  private randomFloat(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  private randomInt(min: number, max: number) {
    return Math.floor(this.randomFloat(min, max + 1));
  }
}
