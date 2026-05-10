import { DeviceDataRepository } from './device-data.repository';
import type { CreateDeviceDataInput, ListDeviceDataQuery, DeviceDataSeriesQuery } from './schemas/device-data.schema';
export declare class DeviceDataService {
    private readonly repository;
    private readonly logger;
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
    series(query: DeviceDataSeriesQuery): Promise<{
        from: Date;
        to: Date;
        series: import("./device-data.repository").DeviceDataSeries[];
    }>;
    findById(id: string): Promise<import("../mongo/schemas/device-data.mongo").DeviceDataModel & {
        id: string;
    }>;
    remove(id: string): Promise<import("../mongo/schemas/device-data.mongo").DeviceDataModel & {
        id: string;
    }>;
    ingestFromZigbeePayload(physicalDeviceId: string, payload: Record<string, unknown>, at: Date): Promise<void>;
}
