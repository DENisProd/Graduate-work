import { PhysicalDeviceRepository } from './physical-device.repository';
import type { CreatePhysicalDeviceInput, UpdatePhysicalDeviceInput, ListPhysicalDevicesQuery } from './schemas/physical-device.schema';
import { DeviceCatalogService } from '../device-catalog/device-catalog.service';
import { DeviceCatalogClient } from '../device-catalog/device-catalog.client';
import { AccessSyncService } from '../access-sync/access-sync.service';
export declare class PhysicalDeviceService {
    private readonly repository;
    private readonly catalogService;
    private readonly catalogClient;
    private readonly accessSync?;
    private readonly logger;
    constructor(repository: PhysicalDeviceRepository, catalogService: DeviceCatalogService, catalogClient: DeviceCatalogClient, accessSync?: AccessSyncService | undefined);
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
    private syncCapabilityFunctions;
    remove(id: string): Promise<import("../mongo/schemas/physical-device.mongo").PhysicalDeviceModel & {
        id: string;
    }>;
}
