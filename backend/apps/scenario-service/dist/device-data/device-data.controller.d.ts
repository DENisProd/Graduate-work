import { DeviceDataService } from './device-data.service';
export declare class DeviceDataController {
    private readonly service;
    constructor(service: DeviceDataService);
    findMany(query: unknown): Promise<{
        items: (import("../mongo/schemas/device-data.mongo").DeviceDataModel & {
            id: string;
        })[];
        total: number;
    }>;
    findOne(params: unknown): Promise<import("../mongo/schemas/device-data.mongo").DeviceDataModel & {
        id: string;
    }>;
    remove(params: unknown): Promise<import("../mongo/schemas/device-data.mongo").DeviceDataModel & {
        id: string;
    }>;
}
