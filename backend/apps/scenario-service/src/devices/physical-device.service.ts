import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { PhysicalDeviceRepository } from './physical-device.repository';
import type {
  CreatePhysicalDeviceInput,
  UpdatePhysicalDeviceInput,
  ListPhysicalDevicesQuery,
} from './schemas/physical-device.schema';

import { DeviceCatalogService } from '../device-catalog/device-catalog.service';
import { DeviceCatalogClient } from '../device-catalog/device-catalog.client';
import { AccessSyncService } from '../access-sync/access-sync.service';

@Injectable()
export class PhysicalDeviceService {
  private readonly logger = new Logger(PhysicalDeviceService.name);

  constructor(
    private readonly repository: PhysicalDeviceRepository,
    private readonly catalogService: DeviceCatalogService,
    private readonly catalogClient: DeviceCatalogClient,
    @Optional() private readonly accessSync?: AccessSyncService,
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
    const assigningToHouse = data.houseId && data.houseId !== existing.houseId;
    const needsCatalogSync =
      assigningToHouse && !existing.deviceTypeId && !data.deviceTypeId;

    let resolvedDeviceId: number | null = existing.deviceId ?? null;

    if (needsCatalogSync) {
      const sync = await this.catalogService.syncWithCatalog({
        model: existing.model,
        manufacturerName: existing.manufacturerName,
        definition: existing.definition,
        friendlyName: existing.friendlyName,
        ieeeAddr: existing.protocolAddress,
      });
      if (sync.deviceTypeId)
        data = { ...data, deviceTypeId: sync.deviceTypeId };
      if (sync.deviceId) {
        data = { ...data, deviceId: sync.deviceId };
        resolvedDeviceId = sync.deviceId;
      }
      if (sync.deviceCategoryId) {
        data = { ...data, deviceCategoryId: sync.deviceCategoryId };
      }
    }

    const updated = await this.repository.update(id, data);

    // After catalog sync, match capabilities to device-functions and register them in access-service
    const houseId = data.houseId ?? existing.houseId;
    if (needsCatalogSync && resolvedDeviceId && houseId && this.accessSync) {
      await this.syncCapabilityFunctions(updated, resolvedDeviceId, houseId);
    }

    return updated;
  }

  private async syncCapabilityFunctions(
    device: { id: string; capabilities?: string[] },
    deviceId: number,
    houseId: string,
  ): Promise<void> {
    const capabilities = device.capabilities ?? [];
    if (capabilities.length === 0) return;

    const functions = await this.catalogClient.findFunctionsByDeviceId(deviceId);
    if (!functions || functions.length === 0) return;

    const capabilitySet = new Set(capabilities.map((c) => c.toLowerCase()));
    const matched = functions.filter((fn) =>
      capabilitySet.has(fn.code.toLowerCase()),
    );

    if (matched.length === 0) {
      this.logger.debug(
        `No matching functions for device ${device.id} (capabilities=[${capabilities.join(', ')}])`,
      );
      return;
    }

    this.logger.log(
      `Linking ${matched.length}/${functions.length} functions for device ${device.id}`,
    );

    await this.accessSync!.onDeviceFunctionsLinked(device.id, houseId, matched);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
