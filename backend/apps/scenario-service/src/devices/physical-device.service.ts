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

    const assigningToHouse = data.houseId && data.houseId !== existing.houseId;
    const needsCatalogSync =
      assigningToHouse && !existing.deviceTypeId && !data.deviceTypeId;

    this.logger.log(
      `[update] id=${id} assigningToHouse=${assigningToHouse} needsCatalogSync=${needsCatalogSync} existing.houseId=${existing.houseId ?? 'null'} → data.houseId=${data.houseId ?? 'null'}`,
    );

    let resolvedDeviceId: number | null = existing.deviceId ?? null;

    if (needsCatalogSync) {
      this.logger.log(
        `[update] triggering catalog sync for physicalDevice id=${id} model=${existing.model ?? '?'} manufacturer=${existing.manufacturerName ?? '?'} capabilities=[${(existing.capabilities ?? []).join(', ')}]`,
      );
      const sync = await this.catalogService.syncWithCatalog({
        model: existing.model,
        manufacturerName: existing.manufacturerName,
        definition: existing.definition,
        friendlyName: existing.friendlyName,
        ieeeAddr: existing.protocolAddress,
      });
      this.logger.log(
        `[update] catalog sync result: deviceTypeId=${sync.deviceTypeId ?? 'null'} deviceId=${sync.deviceId ?? 'null'} deviceCategoryId=${sync.deviceCategoryId ?? 'null'}`,
      );
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

    const houseId = data.houseId ?? existing.houseId;
    if (needsCatalogSync && resolvedDeviceId && houseId && this.accessSync) {
      this.logger.log(
        `[update] running capability sync for physicalDevice id=${id} deviceId=${resolvedDeviceId} houseId=${houseId}`,
      );
      await this.syncCapabilityFunctions(updated, resolvedDeviceId, houseId);
    } else if (needsCatalogSync) {
      this.logger.warn(
        `[update] capability sync SKIPPED: resolvedDeviceId=${resolvedDeviceId ?? 'null'} houseId=${houseId ?? 'null'} accessSync=${this.accessSync ? 'present' : 'missing'}`,
      );
    }

    return updated;
  }

  private async syncCapabilityFunctions(
    device: { id: string; capabilities?: string[] },
    deviceId: number,
    houseId: string,
  ): Promise<void> {
    const capabilities = device.capabilities ?? [];
    this.logger.log(
      `[syncCapabilityFunctions] physicalDevice id=${device.id} deviceId=${deviceId} capabilities (${capabilities.length}): [${capabilities.join(', ')}]`,
    );

    if (capabilities.length === 0) {
      this.logger.warn(
        `[syncCapabilityFunctions] SKIP: device id=${device.id} has no capabilities`,
      );
      return;
    }

    const functions = await this.catalogClient.findFunctionsByDeviceId(deviceId);
    if (!functions || functions.length === 0) {
      this.logger.warn(
        `[syncCapabilityFunctions] SKIP: device-service returned no functions for deviceId=${deviceId}`,
      );
      return;
    }

    this.logger.log(
      `[syncCapabilityFunctions] device-service functions (${functions.length}): [${functions.map((f) => f.code).join(', ')}]`,
    );

    const capabilitySet = new Set(capabilities.map((c) => c.toLowerCase()));
    const matched = functions.filter((fn) =>
      capabilitySet.has(fn.code.toLowerCase()),
    );
    const unmatched = functions
      .filter((fn) => !capabilitySet.has(fn.code.toLowerCase()))
      .map((fn) => fn.code);

    this.logger.log(
      `[syncCapabilityFunctions] capability matching: ${matched.length}/${functions.length} matched | matched=[${matched.map((f) => f.code).join(', ')}] | unmatched=[${unmatched.join(', ')}]`,
    );

    if (matched.length === 0) {
      this.logger.warn(
        `[syncCapabilityFunctions] NO MATCH for device id=${device.id} — capabilities do not intersect with device-service function codes`,
      );
      return;
    }

    this.logger.log(
      `[syncCapabilityFunctions] fetching action IDs from access-service for deviceId=${deviceId}`,
    );
    const actions = await this.accessSync!.findDeviceFunctionActionsByDeviceId(
      deviceId,
    );
    this.logger.log(
      `[syncCapabilityFunctions] received ${actions?.length ?? 0} actions from access-service`,
    );
    const actionIdsByFunctionId = new Map<number, number[]>();
    for (const a of actions ?? []) {
      const list = actionIdsByFunctionId.get(a.deviceFunctionId) ?? [];
      list.push(a.id);
      actionIdsByFunctionId.set(a.deviceFunctionId, list);
    }

    const functionsToLink = matched.map((fn) => ({
      id: fn.id,
      code: fn.code,
      name: fn.name,
      actionIds: actionIdsByFunctionId.get(fn.id) ?? [],
    }));

    this.logger.log(
      `[syncCapabilityFunctions] linking ${functionsToLink.length} functions to access-service: ${functionsToLink.map((f) => `${f.code}(actions=[${f.actionIds.join(',')}])`).join(' ')}`,
    );

    await this.accessSync!.onDeviceFunctionsLinked(
      device.id,
      houseId,
      functionsToLink,
    );

    this.logger.log(
      `[syncCapabilityFunctions] DONE — ${functionsToLink.length} functions registered for physicalDevice id=${device.id}`,
    );
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
