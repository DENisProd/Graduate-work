import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DeviceDataType } from '../common/schemas/enums';
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
    // `findMany` pagination is 1-based (`page` >= 1)
    let page = 1;
    const all: Array<{ id: string; deviceTypeId: number }> = [];

    // paginate through all devices to avoid loading too many at once
    // stops when we've loaded at least "total" devices or page is empty
    for (;;) {
      const { items, total } = await this.physicalDeviceService.findMany({
        page,
        limit,
      });

      if (!items.length) break;

      all.push(
        ...items
          .filter(
            (item): item is (typeof items)[number] & { deviceTypeId: number } =>
              typeof item.deviceTypeId === 'number',
          )
          .map((item) => ({
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
    const types = Object.values(DeviceDataType);
    const type = types[Math.floor(Math.random() * types.length)];

    let unit: string | undefined;
    let value: unknown;
    let capability: string;
    let attribute: string | undefined;

    switch (type) {
      case DeviceDataType.FLOAT: {
        unit = '°C';
        capability = 'temperature_sensor';
        attribute = 'value';
        value = { value: this.randomFloat(18, 26), unit };
        break;
      }
      case DeviceDataType.NUMBER: {
        unit = 'W';
        capability = 'power';
        attribute = 'value';
        value = { value: this.randomInt(0, 2000), unit };
        break;
      }
      case DeviceDataType.STRING: {
        unit = undefined;
        const states = ['idle', 'running', 'error'];
        capability = 'status';
        attribute = 'state';
        value = states[Math.floor(Math.random() * states.length)];
        break;
      }
      case DeviceDataType.BOOLEAN:
      default: {
        unit = undefined;
        capability = 'switch';
        attribute = 'state';
        value = { on: Math.random() > 0.5 };
        break;
      }
    }

    const base: {
      deviceId: string;
      capability: string;
      attribute?: string;
      type: DeviceDataType;
      value: unknown;
      unit?: string;
      timestamp: Date;
      quality?: number;
    } = {
      deviceId,
      capability,
      ...(attribute ? { attribute } : {}),
      type,
      value,
      unit,
      timestamp,
    };

    return base;
  }

  private randomFloat(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  private randomInt(min: number, max: number) {
    return Math.floor(this.randomFloat(min, max + 1));
  }
}
