import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CatalogDeviceType {
  id: number;
  code: string;
  name: string;
}

export interface CatalogDeviceCategory {
  id: number;
  code: string;
  name: string;
  deviceType?: CatalogDeviceType | null;
}

export interface CatalogDevice {
  id: number;
  code: string;
  name: string | null;
  category: CatalogDeviceCategory | null;
}

export interface EnsureCatalogPayload {
  deviceTypeCode: string;
  deviceCategoryCode: string;
  deviceCode: string;
  translations?: {
    deviceType?: Record<string, { name: string; description?: string | null }>;
    deviceCategory?: Record<
      string,
      { name: string; description?: string | null }
    >;
    device?: Record<string, { name: string; description?: string | null }>;
  };
}

export interface EnsureCatalogResult {
  deviceId: number;
  deviceCategoryId: number;
  created: {
    category: boolean;
    device: boolean;
  };
}

export interface CatalogDeviceFunction {
  id: number;
  code: string;
  name: string;
  functionType: 'READ' | 'WRITE' | 'READ_WRITE';
}

@Injectable()
export class DeviceCatalogClient {
  private readonly logger = new Logger(DeviceCatalogClient.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = (
      config.get<string>('DEVICE_SERVICE_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  private async get<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<T>;
    } catch (e) {
      this.logger.error(
        `GET ${path} failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
  }

  private async post<T>(path: string, body: unknown): Promise<T | null> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      return res.json() as Promise<T>;
    } catch (e) {
      this.logger.error(
        `POST ${path} failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
  }

  findDeviceByCode(code: string): Promise<CatalogDevice | null> {
    return this.get<CatalogDevice>(
      `/api/access/v1/devices/code/${encodeURIComponent(code)}`,
    );
  }

  findDeviceTypeByCode(code: string): Promise<CatalogDeviceType | null> {
    return this.get<CatalogDeviceType>(
      `/api/access/v1/device-types/code/${encodeURIComponent(code)}`,
    );
  }

  findDeviceCategoryByCode(
    code: string,
  ): Promise<CatalogDeviceCategory | null> {
    return this.get<CatalogDeviceCategory>(
      `/api/access/v1/device-categories/code/${encodeURIComponent(code)}`,
    );
  }

  createDeviceType(
    code: string,
    name: string,
  ): Promise<CatalogDeviceType | null> {
    return this.post<CatalogDeviceType>('/api/access/v1/admin/device-types', {
      code,
      active: true,
      translations: { en: { name }, ru: { name } },
    });
  }

  createDeviceCategory(
    code: string,
    name: string,
    deviceTypeId: number,
  ): Promise<CatalogDeviceCategory | null> {
    return this.post<CatalogDeviceCategory>('/api/access/v1/admin/device-categories', {
      code,
      deviceTypeId,
      active: true,
      translations: { en: { name }, ru: { name } },
    });
  }

  createDevice(
    code: string,
    name: string,
    deviceCategoryId: number,
  ): Promise<CatalogDevice | null> {
    return this.post<CatalogDevice>('/api/access/v1/admin/devices', {
      code,
      deviceCategoryId,
      status: 'OFFLINE',
      active: true,
      translations: { en: { name }, ru: { name } },
    });
  }

  createDeviceFunction(
    code: string,
    name: string,
    deviceId: number,
    functionType: 'READ' | 'WRITE' | 'READ_WRITE' = 'READ_WRITE',
  ): Promise<{ id: number } | null> {
    return this.post<{ id: number }>('/api/access/v1/admin/device-functions', {
      code,
      deviceId,
      functionType,
      active: true,
      translations: { en: { name }, ru: { name } },
    });
  }

  async ensureCatalog(
    payload: EnsureCatalogPayload,
  ): Promise<EnsureCatalogResult | null> {
    this.logger.log(
      `[ensureCatalog] → POST ${this.baseUrl}/api/access/v1/integration/catalog/ensure | typeCode=${payload.deviceTypeCode} categoryCode=${payload.deviceCategoryCode} deviceCode=${payload.deviceCode}`,
    );
    const result = await this.post<EnsureCatalogResult>(
      '/api/access/v1/integration/catalog/ensure',
      payload,
    );
    if (result) {
      this.logger.log(
        `[ensureCatalog] ← OK deviceId=${result.deviceId} deviceCategoryId=${result.deviceCategoryId} categoryCreated=${result.created.category} deviceCreated=${result.created.device}`,
      );
    } else {
      this.logger.warn(`[ensureCatalog] ← returned null (POST failed or non-2xx)`);
    }
    return result;
  }

  async findFunctionsByDeviceId(
    deviceId: number,
  ): Promise<CatalogDeviceFunction[] | null> {
    this.logger.log(
      `[findFunctionsByDeviceId] → GET ${this.baseUrl}/api/access/v1/device-functions/by-device/${deviceId}/all`,
    );
    const result = await this.get<CatalogDeviceFunction[]>(
      `/api/access/v1/device-functions/by-device/${encodeURIComponent(String(deviceId))}/all`,
    );
    if (result) {
      this.logger.log(
        `[findFunctionsByDeviceId] ← OK ${result.length} functions: [${result.map((f) => f.code).join(', ')}]`,
      );
    } else {
      this.logger.warn(`[findFunctionsByDeviceId] ← returned null for deviceId=${deviceId}`);
    }
    return result;
  }
}
