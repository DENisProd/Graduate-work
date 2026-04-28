import { Injectable } from '@nestjs/common';
import { AccessServiceClient } from './access-service.client';

@Injectable()
export class AccessSyncService {
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
      metadata: device.deviceCategoryId != null
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
}
