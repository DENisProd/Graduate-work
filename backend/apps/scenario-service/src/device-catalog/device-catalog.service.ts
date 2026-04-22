import { Injectable, Logger } from '@nestjs/common';
import { DeviceCatalogClient } from './device-catalog.client';

export interface DeviceCatalogSyncResult {
  /** ID of DeviceType in device-service (e.g. the ZIGBEE type). */
  deviceTypeId: number | null;
  /** ID of abstract Device in device-service matching the physical device model. */
  abstractDeviceId: number | null;
}

const ZIGBEE_TYPE_CODE = 'ZIGBEE';

/** Read-only Zigbee capabilities — sensor data that cannot be actuated. */
const READ_ONLY_CAPABILITIES = new Set([
  'battery',
  'battery_low',
  'battery_voltage',
  'co2',
  'contact',
  'current',
  'energy',
  'humidity',
  'illuminance',
  'illuminance_lux',
  'linkquality',
  'power',
  'pressure',
  'temperature',
  'voltage',
  'water_leak',
  'smoke',
  'gas',
  'carbon_monoxide',
  'tamper',
  'vibration',
  'action',
]);

function toUpperCode(s: string, maxLen = 50): string {
  return s
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, maxLen);
}

function toLowerCode(s: string, maxLen = 50): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, maxLen);
}

function functionType(capability: string): 'READ' | 'WRITE' | 'READ_WRITE' {
  return READ_ONLY_CAPABILITIES.has(capability) ? 'READ' : 'READ_WRITE';
}

@Injectable()
export class DeviceCatalogService {
  private readonly logger = new Logger(DeviceCatalogService.name);

  constructor(private readonly client: DeviceCatalogClient) {}

  /**
   * Synchronises a physical Zigbee device with the device-service catalog.
   *
   * - Looks up an abstract Device by model code.
   * - Creates DeviceType / DeviceCategory / Device / DeviceFunctions if missing.
   * - Returns the resolved deviceTypeId and abstractDeviceId (null on failure).
   *
   * Safe to call on every house-assignment — all operations are idempotent.
   */
  async syncWithCatalog(input: {
    model?: string | null;
    manufacturerName?: string | null;
    capabilities?: string[];
  }): Promise<DeviceCatalogSyncResult> {
    const model = input.model?.trim();
    if (!model) {
      return { deviceTypeId: null, abstractDeviceId: null };
    }

    try {
      // 1. Find existing abstract device by model code
      const existing = await this.client.findDeviceByCode(model);
      if (existing) {
        this.logger.debug(
          `Catalog hit: model=${model} → abstractDeviceId=${existing.id}`,
        );
        const typeId = await this.resolveTypeId(existing.category);
        return { deviceTypeId: typeId, abstractDeviceId: existing.id };
      }

      // 2. Find or create DeviceType (ZIGBEE)
      const deviceType = await this.findOrCreateDeviceType();
      if (!deviceType) {
        this.logger.warn('Cannot find/create ZIGBEE device type — skipping sync');
        return { deviceTypeId: null, abstractDeviceId: null };
      }

      // 3. Find or create DeviceCategory derived from manufacturer
      const categoryCode = this.buildCategoryCode(input.manufacturerName);
      const categoryName = input.manufacturerName?.trim()
        ? `Zigbee ${input.manufacturerName.trim()}`
        : 'Zigbee Generic';
      const category = await this.findOrCreateCategory(
        categoryCode,
        categoryName,
        deviceType.id,
      );
      if (!category) {
        this.logger.warn(
          `Cannot find/create category ${categoryCode} — returning typeId only`,
        );
        return { deviceTypeId: deviceType.id, abstractDeviceId: null };
      }

      // 4. Create abstract Device
      const device = await this.client.createDevice(model, model, category.id);
      if (!device) {
        this.logger.warn(`Cannot create abstract device ${model} in catalog`);
        return { deviceTypeId: deviceType.id, abstractDeviceId: null };
      }
      this.logger.log(
        `Created catalog entry: model=${model} type=${ZIGBEE_TYPE_CODE} category=${categoryCode} abstractDeviceId=${device.id}`,
      );

      // 5. Create DeviceFunctions for each known capability
      await this.createFunctions(device.id, input.capabilities ?? []);

      return { deviceTypeId: deviceType.id, abstractDeviceId: device.id };
    } catch (e) {
      this.logger.error(
        `syncWithCatalog failed for model=${model}: ${e instanceof Error ? e.message : String(e)}`,
      );
      return { deviceTypeId: null, abstractDeviceId: null };
    }
  }

  // ─── private helpers ────────────────────────────────────────────────────────

  private async resolveTypeId(
    category: { id?: number; code?: string; deviceType?: { id: number } | null } | null,
  ): Promise<number | null> {
    if (!category) return null;
    if (category.deviceType?.id) return category.deviceType.id;
    if (category.code) {
      const full = await this.client.findDeviceCategoryByCode(category.code);
      if (full?.deviceType?.id) return full.deviceType.id;
    }
    // Fallback: look up the canonical ZIGBEE type
    const type = await this.client.findDeviceTypeByCode(ZIGBEE_TYPE_CODE);
    return type?.id ?? null;
  }

  private async findOrCreateDeviceType(): Promise<{ id: number } | null> {
    const existing = await this.client.findDeviceTypeByCode(ZIGBEE_TYPE_CODE);
    if (existing) return existing;
    const created = await this.client.createDeviceType(ZIGBEE_TYPE_CODE, 'Zigbee');
    if (created) return created;
    // Race condition: another request may have created it concurrently
    return this.client.findDeviceTypeByCode(ZIGBEE_TYPE_CODE);
  }

  private async findOrCreateCategory(
    code: string,
    name: string,
    deviceTypeId: number,
  ): Promise<{ id: number } | null> {
    const existing = await this.client.findDeviceCategoryByCode(code);
    if (existing) return existing;
    const created = await this.client.createDeviceCategory(code, name, deviceTypeId);
    if (created) return created;
    return this.client.findDeviceCategoryByCode(code);
  }

  private buildCategoryCode(manufacturer?: string | null): string {
    if (!manufacturer?.trim()) return 'ZIGBEE_GENERIC';
    const suffix = toUpperCode(manufacturer.trim(), 40);
    if (!suffix) return 'ZIGBEE_GENERIC';
    return `ZIGBEE_${suffix}`.slice(0, 50);
  }

  private async createFunctions(deviceId: number, capabilities: string[]): Promise<void> {
    for (const cap of capabilities) {
      const code = toLowerCode(cap);
      if (!code || !/^[a-z][a-z0-9_]*$/.test(code)) continue;
      const result = await this.client.createDeviceFunction(
        code,
        cap,
        deviceId,
        functionType(cap),
      );
      if (!result) {
        this.logger.debug(
          `Skipped function ${code} for device ${deviceId} (may already exist)`,
        );
      }
    }
  }
}
