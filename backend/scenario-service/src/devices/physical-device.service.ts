import { Injectable, NotFoundException } from '@nestjs/common';
import { PhysicalDeviceRepository } from './physical-device.repository';
import type {
  CreatePhysicalDeviceInput,
  UpdatePhysicalDeviceInput,
  ListPhysicalDevicesQuery,
} from './schemas/physical-device.schema';

@Injectable()
export class PhysicalDeviceService {
  constructor(private readonly repository: PhysicalDeviceRepository) {}

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
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
