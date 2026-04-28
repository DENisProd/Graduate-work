import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { DeviceDataType } from '../../common/schemas/enums';
export declare const DEVICE_DATA_MODEL = "DeviceData";
export declare class DeviceDataModel {
    deviceId: Types.ObjectId;
    capability: string;
    attribute?: string | null;
    type: DeviceDataType;
    value: unknown;
    unit?: string | null;
    quality?: number | null;
    timestamp: Date;
}
export type DeviceDataDocument = HydratedDocument<DeviceDataModel>;
export declare const DeviceDataSchema: any;
