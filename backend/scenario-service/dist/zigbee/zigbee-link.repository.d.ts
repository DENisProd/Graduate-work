import type { Model } from 'mongoose';
import type { ListZigbeeLinksQuery } from './schemas/zigbee.schemas';
import { DeviceNetworkLinkModel } from '../mongo/schemas/device-network-link.mongo';
export type DeviceNetworkLink = DeviceNetworkLinkModel & {
    id: string;
};
export declare class ZigbeeLinkRepository {
    private readonly model;
    constructor(model: Model<DeviceNetworkLinkModel>);
    private map;
    createMany(input: {
        collectedAt?: Date;
        links: Array<{
            sourceDeviceId: string;
            targetDeviceId: string;
            protocol: string;
            linkQuality?: number;
            rssi?: number;
            lqi?: number;
            metadata?: Record<string, unknown>;
        }>;
    }): Promise<{
        items: DeviceNetworkLink[];
        inserted: number;
    }>;
    findMany(query: ListZigbeeLinksQuery): Promise<{
        items: DeviceNetworkLink[];
        total: number;
    }>;
}
