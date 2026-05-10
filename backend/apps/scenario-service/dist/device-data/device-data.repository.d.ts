import type { Model } from 'mongoose';
import type { CreateDeviceDataInput, ListDeviceDataQuery } from './schemas/device-data.schema';
import { DeviceDataModel } from '../mongo/schemas/device-data.mongo';
import type { DeviceDataSeriesRange } from './schemas/device-data.schema';
type DeviceData = DeviceDataModel & {
    id: string;
};
export type DeviceDataSeriesPoint = {
    ts: Date;
    value: number;
};
export type DeviceDataSeries = {
    key: string;
    capability: string;
    attribute: string | null;
    unit: string | null;
    points: DeviceDataSeriesPoint[];
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
    private bucketForRange;
    private booleanBucketForRange;
    private msForRange;
    series(params: {
        deviceId: string;
        range: DeviceDataSeriesRange;
        capabilities?: string[];
        to?: Date;
    }): Promise<{
        from: Date;
        to: Date;
        series: DeviceDataSeries[];
    }>;
    delete(id: string): Promise<DeviceData>;
}
export {};
