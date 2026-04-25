import { Injectable, NotFoundException } from '@nestjs/common';
import { PhysicalDeviceRepository } from './physical-device.repository';
import type {
  CreatePhysicalDeviceInput,
  UpdatePhysicalDeviceInput,
  ListPhysicalDevicesQuery,
} from './schemas/physical-device.schema';

import { DeviceCatalogService } from '../device-catalog/device-catalog.service';

@Injectable()
export class PhysicalDeviceService {
  constructor(
    private readonly repository: PhysicalDeviceRepository,
    private readonly catalogService: DeviceCatalogService,
  ) {}

  async create(data: CreatePhysicalDeviceInput) {
    return this.repository.create(data);
  }

  async findMany(query: ListPhysicalDevicesQuery) {
    const { page, limit, houseId, roomId } = query;
    return this.repository.findMany({ page, limit, houseId, roomId });
  }

  async findById(id: string) {
    const device = await this.repository.findById(id);
    if (!device) throw new NotFoundException(`PhysicalDevice ${id} not found`);
    return device;
  }

  async update(id: string, data: UpdatePhysicalDeviceInput) {
    const existing = await this.findById(id);

    // When a houseId is being assigned for the first time (or forced re-sync),
    // resolve the abstract device from the catalog using the Zigbee model data.
    const assigningToHouse =
      data.houseId && data.houseId !== existing.houseId;
    const needsCatalogSync =
      assigningToHouse && !existing.deviceTypeId && !data.deviceTypeId;

    if (needsCatalogSync) {
      const sync = await this.catalogService.syncWithCatalog({
        model: existing.model,
        manufacturerName: existing.manufacturerName,
        definition: existing.definition,
        friendlyName: existing.friendlyName,
        ieeeAddr: existing.protocolAddress,
      });
      if (sync.deviceTypeId) data = { ...data, deviceTypeId: sync.deviceTypeId };
      if (sync.deviceId) data = { ...data, deviceId: sync.deviceId };
      if (sync.deviceCategoryId) {
        data = { ...data, deviceCategoryId: sync.deviceCategoryId };
      }
    }

    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
