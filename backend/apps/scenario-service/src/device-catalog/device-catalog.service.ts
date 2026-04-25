import { Injectable, Logger } from '@nestjs/common';
import { DeviceCatalogClient } from './device-catalog.client';

export interface DeviceCatalogSyncResult {
  /** ID of DeviceType in device-service (for now always ZIGBEE). */
  deviceTypeId: number | null;
  /** ID of abstract Device in device-service matching the physical device model. */
  deviceId: number | null;
  /** ID of abstract DeviceCategory in device-service matching the physical device model. */
  deviceCategoryId: number | null;
}

const ZIGBEE_TYPE_CODE = 'ZIGBEE';

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

function titleFromCode(s: string): string {
  const normalized = toLowerCode(s, 120);
  if (!normalized) return 'Unknown';
  return normalized
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

@Injectable()
export class DeviceCatalogService {
  private readonly logger = new Logger(DeviceCatalogService.name);

  constructor(private readonly client: DeviceCatalogClient) {}

  async syncWithCatalog(input: {
    model?: string | null;
    manufacturerName?: string | null;
    definition?: Record<string, unknown> | null;
    friendlyName?: string | null;
    ieeeAddr?: string | null;
  }): Promise<DeviceCatalogSyncResult> {
    const modelFromDefinition =
      typeof input.definition?.model === 'string'
        ? input.definition.model
        : null;
    const model = modelFromDefinition?.trim() || input.model?.trim() || null;
    if (!model && !input.ieeeAddr?.trim()) {
      return { deviceTypeId: null, deviceId: null, deviceCategoryId: null };
    }

    const categoryCode = this.buildCategoryCode({
      manufacturerName: input.manufacturerName,
      model,
      definition: input.definition ?? null,
    });
    const deviceCode = this.buildDeviceCode({
      manufacturerName: input.manufacturerName,
      model,
      definition: input.definition ?? null,
      ieeeAddr: input.ieeeAddr,
    });
    if (!deviceCode) {
      return { deviceTypeId: null, deviceId: null, deviceCategoryId: null };
    }

    const typeName = titleFromCode(ZIGBEE_TYPE_CODE);
    const categoryName = titleFromCode(categoryCode);
    const deviceName = this.pickDeviceName(input.friendlyName, model, deviceCode);

    try {
      const ensured = await this.client.ensureCatalog({
        deviceTypeCode: ZIGBEE_TYPE_CODE,
        deviceCategoryCode: categoryCode,
        deviceCode,
        translations: {
          deviceType: {
            en: { name: typeName },
            ru: { name: typeName },
          },
          deviceCategory: {
            en: { name: categoryName },
            ru: { name: categoryName },
          },
          device: {
            en: { name: deviceName },
            ru: { name: deviceName },
          },
        },
      });

      if (!ensured) {
        return { deviceTypeId: null, deviceId: null, deviceCategoryId: null };
      }

      if (ensured.created.category || ensured.created.device) {
        this.logger.log(
          `Catalog ensured for code=${deviceCode}: categoryCreated=${ensured.created.category}, deviceCreated=${ensured.created.device}`,
        );
      }

      const zigbeeType = await this.client.findDeviceTypeByCode(ZIGBEE_TYPE_CODE);
      return {
        deviceTypeId: zigbeeType?.id ?? null,
        deviceId: ensured.deviceId,
        deviceCategoryId: ensured.deviceCategoryId,
      };
    } catch (e) {
      this.logger.error(
        `syncWithCatalog failed for code=${deviceCode}: ${e instanceof Error ? e.message : String(e)}`,
      );
      return { deviceTypeId: null, deviceId: null, deviceCategoryId: null };
    }
  }

  private buildCategoryCode(input: {
    manufacturerName?: string | null;
    model?: string | null;
    definition?: Record<string, unknown> | null;
  }): string {
    const manufacturer = input.manufacturerName?.trim();
    const model = input.model?.trim();
    if (manufacturer && model) {
      const code = toUpperCode(`${manufacturer}_${model}`);
      if (code) return `ZIGBEE_${code}`.slice(0, 50);
    }
    if (model) {
      const code = toUpperCode(model);
      if (code) return `ZIGBEE_${code}`.slice(0, 50);
    }
    const definitionModel =
      typeof input.definition?.model === 'string'
        ? input.definition.model.trim()
        : '';
    if (definitionModel) {
      const code = toUpperCode(definitionModel);
      if (code) return `ZIGBEE_${code}`.slice(0, 50);
    }
    return 'ZIGBEE_UNKNOWN';
  }

  private buildDeviceCode(input: {
    manufacturerName?: string | null;
    model?: string | null;
    definition?: Record<string, unknown> | null;
    ieeeAddr?: string | null;
  }): string | null {
    const manufacturer = input.manufacturerName?.trim();
    const model = input.model?.trim();
    if (manufacturer && model) {
      const code = toUpperCode(`ZIGBEE_${manufacturer}_${model}`, 100);
      if (code) return code;
    }
    if (model) {
      const code = toUpperCode(`ZIGBEE_${model}`, 100);
      if (code) return code;
    }
    const definitionModel =
      typeof input.definition?.model === 'string'
        ? input.definition.model.trim()
        : '';
    if (definitionModel) {
      const code = toUpperCode(`ZIGBEE_${definitionModel}`, 100);
      if (code) return code;
    }
    const ieee = input.ieeeAddr?.trim();
    if (ieee) {
      const code = toUpperCode(`ZIGBEE_${ieee}`, 100);
      if (code) return code;
    }
    return null;
  }

  private pickDeviceName(
    friendlyName?: string | null,
    model?: string | null,
    fallbackCode?: string,
  ): string {
    const fn = friendlyName?.trim();
    if (fn) return fn;
    const md = model?.trim();
    if (md) return md;
    return titleFromCode(fallbackCode ?? 'unknown');
  }
}
