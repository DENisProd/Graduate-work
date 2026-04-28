import type { HydratedDocument } from 'mongoose';
import { ZigbeeDeviceType } from '../../zigbee/schemas/zigbee.schemas';
export declare const PHYSICAL_DEVICE_MODEL = "PhysicalDevice";
export declare class PhysicalDeviceModel {
    name?: string | null;
    description?: string | null;
    houseId?: string | null;
    roomId?: string | null;
    deviceId?: number | null;
    deviceCategoryId?: number | null;
    protocolAddress?: string | null;
    networkAddress?: number | null;
    type?: ZigbeeDeviceType;
    deviceTypeId?: number | null;
    manufacturerName?: string | null;
    model?: string | null;
    friendlyName?: string | null;
    firmwareVersion?: string | null;
    lastSeen?: Date | null;
    definition?: Record<string, unknown> | null;
    capabilities?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export type PhysicalDeviceDocument = HydratedDocument<PhysicalDeviceModel>;
export declare const PhysicalDeviceSchema: any;
