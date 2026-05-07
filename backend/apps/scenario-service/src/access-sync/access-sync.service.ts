import { Injectable, Logger } from '@nestjs/common';
import { AccessServiceClient } from './access-service.client';

@Injectable()
export class AccessSyncService {
  private readonly logger = new Logger(AccessSyncService.name);

  constructor(private readonly client: AccessServiceClient) {}

  async onPhysicalDeviceCreated(device: {
    id: string;
    name?: string | null;
    houseId?: string | null;
    roomId?: string | null;
    deviceCategoryId?: number | null;
  }): Promise<string | null> {
    if (!device.houseId) return null;

    const result = await this.client.registerResource({
      houseId: device.houseId,
      parentExternalId: device.roomId ?? undefined,
      externalId: device.id,
      type: 'DEVICE',
      name: device.name ?? undefined,
      metadata:
        device.deviceCategoryId != null
          ? { category: device.deviceCategoryId }
          : undefined,
    });

    return result?.id ?? null;
  }

  async onPhysicalDeviceRemoved(accessResourceId: string): Promise<void> {
    await this.client.deleteResource(accessResourceId);
  }

  async onScenarioCreated(scenario: {
    id: string;
    name: string;
    houseId: string;
  }): Promise<string | null> {
    const result = await this.client.registerResource({
      houseId: scenario.houseId,
      externalId: scenario.id,
      type: 'AUTOMATION',
      name: scenario.name,
    });

    return result?.id ?? null;
  }

  async onScenarioRemoved(accessResourceId: string): Promise<void> {
    await this.client.deleteResource(accessResourceId);
  }

  /**
   * Registers matched device-functions as DEVICE_FUNCTION resources under the physical device.
   * Called after capabilities are resolved against catalog functions.
   */
  async onDeviceFunctionsLinked(
    physicalDeviceId: string,
    houseId: string,
    functions: Array<{ id: number; code: string; name: string }>,
  ): Promise<void> {
    for (const fn of functions) {
      const externalId = `fn:${physicalDeviceId}:${fn.id}`;
      const result = await this.client.registerResource({
        houseId,
        parentExternalId: physicalDeviceId,
        externalId,
        type: 'DEVICE_FUNCTION',
        name: fn.name,
        metadata: { deviceFunctionId: fn.id, capability: fn.code },
      });
      if (result) {
        this.logger.log(
          `Registered DEVICE_FUNCTION externalId=${externalId} resourceId=${result.id}`,
        );
      }
    }
  }
}
