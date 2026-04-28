import type { HydratedDocument } from 'mongoose';
export declare const ZIGBEE_STATE_MODEL = "ZigbeeDeviceState";
export declare class ZigbeeDeviceStateModel {
    deviceIeeeAddr: string;
    timestamp: Date;
    payload: Record<string, unknown>;
    state?: string | null;
    brightness?: number | null;
    linkquality?: number | null;
    colorMode?: string | null;
    occupancy?: boolean | null;
    temperature?: number | null;
    humidity?: number | null;
    battery?: number | null;
}
export type ZigbeeDeviceStateDocument = HydratedDocument<ZigbeeDeviceStateModel>;
export declare const ZigbeeStateSchema: any;
