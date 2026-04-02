import { DeviceDataRepository } from './device-data.repository';
import type { CreateDeviceDataInput, ListDeviceDataQuery } from './schemas/device-data.schema';
export declare class DeviceDataService {
    private readonly repository;
    constructor(repository: DeviceDataRepository);
    create(data: CreateDeviceDataInput): Promise<import("../mongo/schemas/device-data.mongo").DeviceDataModel & {
        id: string;
    }>;
    findMany(query: ListDeviceDataQuery): Promise<{
        items: (import("../mongo/schemas/device-data.mongo").DeviceDataModel & {
            id: string;
        })[];
        total: number;
    }>;
    findById(id: string): Promise<import("../mongo/schemas/device-data.mongo").DeviceDataModel & {
        id: string;
    }>;
    remove(id: string): Promise<import("../mongo/schemas/device-data.mongo").DeviceDataModel & {
        id: string;
    }>;
}
