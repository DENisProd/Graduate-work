import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
export declare enum Protocol {
    Zigbee = "Zigbee",
    ZWave = "ZWave",
    Matter = "Matter",
    WiFi = "WiFi",
    Bluetooth = "Bluetooth",
    Unknown = "Unknown"
}
export declare const DEVICE_NETWORK_LINK_MODEL = "DeviceNetworkLink";
export declare class DeviceNetworkLinkModel {
    sourceDeviceId: Types.ObjectId;
    targetDeviceId: Types.ObjectId;
    protocol: Protocol;
    linkQuality?: number | null;
    rssi?: number | null;
    lqi?: number | null;
    metadata?: Record<string, unknown> | null;
    collectedAt: Date;
}
export type DeviceNetworkLinkDocument = HydratedDocument<DeviceNetworkLinkModel>;
export declare const DeviceNetworkLinkSchema: any;
