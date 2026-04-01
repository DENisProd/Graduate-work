import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceDataRepository } from './device-data.repository';
import type {
  CreateDeviceDataInput,
  ListDeviceDataQuery,
} from './schemas/device-data.schema';

@Injectable()
export class DeviceDataService {
  constructor(private readonly repository: DeviceDataRepository) {}

  async create(data: CreateDeviceDataInput) {
    return this.repository.create(data);
  }

  async findMany(query: ListDeviceDataQuery) {
    return this.repository.findMany(query);
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
}
