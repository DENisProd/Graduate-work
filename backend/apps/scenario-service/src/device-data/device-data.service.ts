import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { mapZigbeePayloadToDeviceDataInputs } from './ingestion/map-zigbee-payload-to-device-data';
import { DeviceDataRepository } from './device-data.repository';
import type {
  CreateDeviceDataInput,
  ListDeviceDataQuery,
  DeviceDataSeriesQuery,
} from './schemas/device-data.schema';

@Injectable()
export class DeviceDataService {
  private readonly logger = new Logger(DeviceDataService.name);

  constructor(private readonly repository: DeviceDataRepository) {}

  async create(data: CreateDeviceDataInput) {
    return this.repository.create(data);
  }

  async findMany(query: ListDeviceDataQuery) {
    return this.repository.findMany(query);
  }

  async series(query: DeviceDataSeriesQuery) {
    const capabilities =
      query.capabilities
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? undefined;
    return this.repository.series({
      deviceId: query.deviceId,
      range: query.range,
      capabilities,
      to: query.to,
    });
  }

  async findById(id: string) {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`DeviceData ${id} not found`);
    return row;
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.delete(id);
  }

  async ingestFromZigbeePayload(
    physicalDeviceId: string,
    payload: Record<string, unknown>,
    at: Date,
  ): Promise<void> {
    if (!isValidObjectId(physicalDeviceId)) return;
    const rows = mapZigbeePayloadToDeviceDataInputs(
      physicalDeviceId,
      payload,
      at,
    );
    if (rows.length === 0) return;
    try {
      await Promise.all(rows.map((r) => this.repository.create(r)));
    } catch (e) {
      this.logger.warn(
        `DeviceData ingest: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
