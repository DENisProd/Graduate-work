import { Injectable } from '@nestjs/common';
import { ZigbeeDeviceRepository } from './zigbee-device.repository';
import { ZigbeeLinkRepository } from './zigbee-link.repository';
import { ZigbeeStateRepository } from './zigbee-state.repository';
import { normalizeZigbeePayload } from './normalize-zigbee-payload';
import type {
  CreateZigbeeLinksBatchInput,
  CreateZigbeeStateInput,
  ListZigbeeDevicesQuery,
  ListZigbeeLinksQuery,
  ListZigbeeStatesQuery,
  UpsertZigbeeDeviceInput,
} from './schemas/zigbee.schemas';

@Injectable()
export class ZigbeeService {
  constructor(
    private readonly devices: ZigbeeDeviceRepository,
    private readonly states: ZigbeeStateRepository,
    private readonly links: ZigbeeLinkRepository,
  ) {}

  upsertDevice(input: UpsertZigbeeDeviceInput) {
    return this.devices.upsertByIeeeAddr(input);
  }

  createState(input: CreateZigbeeStateInput) {
    const normalized = normalizeZigbeePayload(input.payload);
    return this.states.create({
      ...input,
      state: input.state ?? normalized.state,
      brightness: input.brightness ?? normalized.brightness,
      linkquality: input.linkquality ?? normalized.linkquality,
      colorMode: input.colorMode ?? normalized.colorMode,
      occupancy: input.occupancy ?? normalized.occupancy,
      temperature: input.temperature ?? normalized.temperature,
      humidity: input.humidity ?? normalized.humidity,
      battery: input.battery ?? normalized.battery,
    });
  }

  createLinksBatch(input: CreateZigbeeLinksBatchInput) {
    return this.links.createMany({
      collectedAt: input.collectedAt,
      links: input.links,
    });
  }

  listDevices(query: ListZigbeeDevicesQuery) {
    return this.devices.findMany(query);
  }

  getDeviceByIeeeAddr(ieeeAddr: string) {
    return this.devices.findByIeeeAddr(ieeeAddr);
  }

  listStates(query: ListZigbeeStatesQuery) {
    return this.states.findMany(query);
  }

  listLinks(query: ListZigbeeLinksQuery) {
    return this.links.findMany(query);
  }
}

