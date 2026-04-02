import type { Model } from 'mongoose';
import type { CreateDeviceDataInput, ListDeviceDataQuery } from './schemas/device-data.schema';
import { DeviceDataModel } from '../mongo/schemas/device-data.mongo';
type DeviceData = DeviceDataModel & {
    id: string;
};
export declare class DeviceDataRepository {
    private readonly model;
    constructor(model: Model<DeviceDataModel>);
    private map;
    create(input: CreateDeviceDataInput): Promise<DeviceData>;
    findById(id: string): Promise<DeviceData | null>;
    findMany(params: ListDeviceDataQuery): Promise<{
        items: DeviceData[];
        total: number;
    }>;
    delete(id: string): Promise<DeviceData>;
}
export {};
