import { PhysicalDeviceRepository } from './physical-device.repository';
import type { CreatePhysicalDeviceInput, UpdatePhysicalDeviceInput, ListPhysicalDevicesQuery } from './schemas/physical-device.schema';
export declare class PhysicalDeviceService {
    private readonly repository;
    constructor(repository: PhysicalDeviceRepository);
    create(data: CreatePhysicalDeviceInput): Promise<import("../mongo/schemas/physical-device.mongo").PhysicalDeviceModel & {
        id: string;
    }>;
    findMany(query: ListPhysicalDevicesQuery): Promise<{
        items: (import("../mongo/schemas/physical-device.mongo").PhysicalDeviceModel & {
            id: string;
        })[];
        total: number;
    }>;
    findById(id: string): Promise<import("../mongo/schemas/physical-device.mongo").PhysicalDeviceModel & {
        id: string;
    }>;
    update(id: string, data: UpdatePhysicalDeviceInput): Promise<import("../mongo/schemas/physical-device.mongo").PhysicalDeviceModel & {
        id: string;
    }>;
    remove(id: string): Promise<import("../mongo/schemas/physical-device.mongo").PhysicalDeviceModel & {
        id: string;
    }>;
}
