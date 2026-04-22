import type { Model } from 'mongoose';
import type { CreateZigbeeStateInput } from './schemas/zigbee.schemas';
import type { ListZigbeeStatesQuery } from './schemas/zigbee.schemas';
import { ZigbeeDeviceStateModel } from '../mongo/schemas/zigbee-state.mongo';
export type ZigbeeDeviceState = ZigbeeDeviceStateModel & {
    id: string;
};
export declare class ZigbeeStateRepository {
    private readonly model;
    constructor(model: Model<ZigbeeDeviceStateModel>);
    private map;
    create(input: CreateZigbeeStateInput): Promise<ZigbeeDeviceState>;
    private mapPlain;
    findLatestByDeviceIeeeAddrs(deviceIeeeAddrs: string[]): Promise<Map<string, ZigbeeDeviceState>>;
    deleteManyByIeeeAddr(ieeeAddr: string): Promise<number>;
    findMany(query: ListZigbeeStatesQuery): Promise<{
        items: ZigbeeDeviceState[];
        total: number;
    }>;
}
