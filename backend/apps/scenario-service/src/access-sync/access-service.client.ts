import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RegisterResourcePayload {
  houseId: string;
  parentExternalId?: string;
  externalId: string;
  type: 'DEVICE' | 'AUTOMATION' | 'DEVICE_FUNCTION';
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface DeviceFunctionActionDto {
  id: number;
  code: string;
  deviceFunctionId: number;
  actionType: string;
  payloadTemplate?: string | null;
  active: boolean;
}

@Injectable()
export class AccessServiceClient {
  private readonly logger = new Logger(AccessServiceClient.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = (
      config.get<string>('ACCESS_SERVICE_URL') ?? 'http://localhost:8085'
    ).replace(/\/$/, '');
  }

  async registerResource(
    payload: RegisterResourcePayload,
  ): Promise<{ id: string } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/access/v1/resources/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      return res.json() as Promise<{ id: string }>;
    } catch (e) {
      this.logger.error(
        `registerResource(externalId=${payload.externalId}) failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
  }

  async deleteResource(id: string): Promise<void> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/access/v1/resources/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
        },
      );
      if (!res.ok && res.status !== 404) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      this.logger.error(
        `deleteResource(${id}) failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  async findDeviceFunctionActionsByDeviceId(
    deviceId: number,
  ): Promise<DeviceFunctionActionDto[] | null> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/access/v1/device-function-actions/by-device/${encodeURIComponent(String(deviceId))}/all`,
      );
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      return res.json() as Promise<DeviceFunctionActionDto[]>;
    } catch (e) {
      this.logger.error(
        `findDeviceFunctionActionsByDeviceId(deviceId=${deviceId}) failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
  }
}
