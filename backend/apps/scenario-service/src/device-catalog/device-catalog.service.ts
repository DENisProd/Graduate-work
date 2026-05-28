import { Injectable, Logger, Optional } from '@nestjs/common';
import { DeviceCatalogClient } from './device-catalog.client';
import { LlmService } from '../llm/llm.service';
import {
  llmDeviceCatalogSchema,
  type LlmDeviceCatalogResult,
} from '../llm/llm.types';

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

  constructor(
    private readonly client: DeviceCatalogClient,
    @Optional() private readonly llm?: LlmService,
  ) {}

  async syncWithCatalog(input: {
    model?: string | null;
    manufacturerName?: string | null;
    definition?: Record<string, unknown> | null;
    friendlyName?: string | null;
    ieeeAddr?: string | null;
  }): Promise<DeviceCatalogSyncResult> {
    this.logger.log(
      `[syncWithCatalog] START ieeeAddr=${input.ieeeAddr ?? '?'} model=${input.model ?? '?'} manufacturer=${input.manufacturerName ?? '?'}`,
    );

    const modelFromDefinition =
      typeof input.definition?.model === 'string'
        ? input.definition.model
        : null;
    const model = modelFromDefinition?.trim() || input.model?.trim() || null;
    if (!model && !input.ieeeAddr?.trim()) {
      this.logger.warn(
        `[syncWithCatalog] SKIP: no model and no ieeeAddr — cannot build device code`,
      );
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

    this.logger.log(
      `[syncWithCatalog] codes built: categoryCode=${categoryCode} deviceCode=${deviceCode ?? 'null'}`,
    );

    if (!deviceCode) {
      this.logger.warn(`[syncWithCatalog] SKIP: deviceCode could not be built`);
      return { deviceTypeId: null, deviceId: null, deviceCategoryId: null };
    }

    const typeName = titleFromCode(ZIGBEE_TYPE_CODE);
    const fallbackCategoryName = titleFromCode(categoryCode);
    const fallbackDeviceName = this.pickDeviceName(
      input.friendlyName,
      model,
      deviceCode,
    );

    this.logger.debug(
      `[syncWithCatalog] fallback names: category="${fallbackCategoryName}" device="${fallbackDeviceName}"`,
    );

    this.logger.debug(`[syncWithCatalog] running LLM enrichment for model=${model ?? '?'}`);
    const llmResult = await this.enrichWithLlm({
      model,
      manufacturerName: input.manufacturerName,
      exposes: Array.isArray(input.definition?.exposes)
        ? (input.definition.exposes as unknown[])
        : [],
      friendlyName: input.friendlyName,
    });

    if (llmResult) {
      this.logger.log(
        `[syncWithCatalog] LLM result: category="${llmResult.category.en.name}" device="${llmResult.device.en.name}" functions=${llmResult.functions.length}`,
      );
    } else {
      this.logger.debug(`[syncWithCatalog] LLM enrichment returned null, using fallback names`);
    }

    try {
      this.logger.log(
        `[syncWithCatalog] calling ensureCatalog → POST /api/access/v1/integration/catalog/ensure deviceTypeCode=ZIGBEE categoryCode=${categoryCode} deviceCode=${deviceCode}`,
      );
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
            en: {
              name: llmResult?.category.en.name ?? fallbackCategoryName,
              description: llmResult?.category.en.description,
            },
            ru: {
              name: llmResult?.category.ru.name ?? fallbackCategoryName,
              description: llmResult?.category.ru.description,
            },
          },
          device: {
            en: {
              name: llmResult?.device.en.name ?? fallbackDeviceName,
              description: llmResult?.device.en.description,
            },
            ru: {
              name: llmResult?.device.ru.name ?? fallbackDeviceName,
              description: llmResult?.device.ru.description,
            },
          },
        },
      });

      if (!ensured) {
        this.logger.warn(
          `[syncWithCatalog] ensureCatalog returned null for deviceCode=${deviceCode}`,
        );
        return { deviceTypeId: null, deviceId: null, deviceCategoryId: null };
      }

      this.logger.log(
        `[syncWithCatalog] ensureCatalog response: deviceId=${ensured.deviceId} deviceCategoryId=${ensured.deviceCategoryId} categoryCreated=${ensured.created.category} deviceCreated=${ensured.created.device}`,
      );

      if (
        ensured.created.device &&
        llmResult &&
        llmResult.functions.length > 0
      ) {
        this.logger.log(
          `[syncWithCatalog] new device created — creating ${llmResult.functions.length} functions via LLM result`,
        );
        await this.createFunctions(ensured.deviceId, llmResult.functions);
      }

      const zigbeeType =
        await this.client.findDeviceTypeByCode(ZIGBEE_TYPE_CODE);
      this.logger.log(
        `[syncWithCatalog] DONE deviceTypeId=${zigbeeType?.id ?? 'null'} deviceId=${ensured.deviceId} deviceCategoryId=${ensured.deviceCategoryId}`,
      );
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

  private async enrichWithLlm(input: {
    model: string | null;
    manufacturerName?: string | null;
    exposes: unknown[];
    friendlyName?: string | null;
  }): Promise<LlmDeviceCatalogResult | null> {
    if (!this.llm) return null;

    const systemPrompt = `You are a smart home device expert. Given a Zigbee device's technical data, generate a JSON object with human-friendly names and descriptions in English and Russian, and a list of device functions derived from the "exposes" capabilities.

Rules:
- category: the product family / manufacturer category (e.g. "IKEA Smart Lighting", "Aqara Sensors")
- device: the specific device model name (friendly, not a code)
- functions: derive from exposes properties; use lower_snake_case codes (e.g. "brightness", "color_temp", "occupancy"); type READ for sensors, WRITE for actuators, READ_WRITE for both
- Return ONLY valid JSON matching this schema exactly:
{
  "category": { "en": { "name": string, "description"?: string }, "ru": { "name": string, "description"?: string } },
  "device":   { "en": { "name": string, "description"?: string }, "ru": { "name": string, "description"?: string } },
  "functions": [{ "code": string, "type": "READ"|"WRITE"|"READ_WRITE", "en": { "name": string }, "ru": { "name": string } }]
}`;

    const userPrompt = `Device model: ${input.model ?? 'unknown'}
Manufacturer: ${input.manufacturerName ?? 'unknown'}
Friendly name: ${input.friendlyName ?? 'unknown'}
Zigbee exposes: ${JSON.stringify(input.exposes.slice(0, 30), null, 2)}`;

    const result = await this.llm.generateJson(
      systemPrompt,
      userPrompt,
      llmDeviceCatalogSchema,
      2,
    );

    if (!result) {
      this.logger.warn(
        `LLM enrichment skipped for model=${input.model ?? 'unknown'}, using fallback names`,
      );
    }

    return result;
  }

  private async createFunctions(
    deviceId: number,
    functions: LlmDeviceCatalogResult['functions'],
  ): Promise<void> {
    for (const fn of functions) {
      try {
        await this.client.createDeviceFunction(
          fn.code,
          fn.en.name,
          deviceId,
          fn.type,
        );
        this.logger.log(
          `Created function code=${fn.code} for deviceId=${deviceId}`,
        );
      } catch (e) {
        this.logger.warn(
          `Failed to create function code=${fn.code}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
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
