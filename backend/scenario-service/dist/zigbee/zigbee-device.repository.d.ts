import type { Model } from 'mongoose';
import type { UpsertZigbeeDeviceInput } from './schemas/zigbee.schemas';
import type { ListZigbeeDevicesQuery } from './schemas/zigbee.schemas';
import { PhysicalDeviceModel } from '../mongo/schemas/physical-device.mongo';
export type ZigbeeDevice = {
    id: string;
    physicalDeviceId: string;
    ieeeAddr: string;
    networkAddress?: number | null;
    type?: PhysicalDeviceModel['type'];
    manufacturerName?: string | null;
    modelId?: string | null;
    friendlyName?: string | null;
    lastSeen?: Date | null;
    definition?: Record<string, unknown> | null;
    capabilities?: string[];
};
export declare class ZigbeeDeviceRepository {
    private readonly model;
    constructor(model: Model<PhysicalDeviceModel>);
    private map;
    upsertByIeeeAddr(input: UpsertZigbeeDeviceInput): Promise<ZigbeeDevice>;
    findByIeeeAddr(ieeeAddr: string): Promise<ZigbeeDevice | null>;
    findMany(query: ListZigbeeDevicesQuery): Promise<{
        items: ZigbeeDevice[];
        total: number;
    }>;
}
