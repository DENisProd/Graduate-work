import type { Model } from 'mongoose';
import type { ListZigbeeDeviceLogsQuery } from './schemas/zigbee.schemas';
import { ZigbeeDeviceLogKind, ZigbeeDeviceLogModel, ZigbeeDeviceLogSource } from '../mongo/schemas/zigbee-device-log.mongo';
import type { ZigbeeDeviceState } from './zigbee-state.repository';
export type ZigbeeDeviceLogEntry = ZigbeeDeviceLogModel & {
    id: string;
};
export type CreateZigbeeDeviceLogInput = {
    deviceIeeeAddr: string;
    physicalDeviceId?: string | null;
    timestamp?: Date;
    source: ZigbeeDeviceLogSource;
    kind: ZigbeeDeviceLogKind;
    message?: string | null;
    metrics?: ZigbeeDeviceLogModel['metrics'];
    payloadKeys?: string[];
    stateDocumentId?: string | null;
    metadata?: Record<string, unknown> | null;
};
export declare class ZigbeeDeviceLogRepository {
    private readonly model;
    constructor(model: Model<ZigbeeDeviceLogModel>);
    private map;
    create(input: CreateZigbeeDeviceLogInput): Promise<ZigbeeDeviceLogEntry>;
    appendFromState(params: {
        state: ZigbeeDeviceState;
        physicalDeviceId?: string | null;
        source: ZigbeeDeviceLogSource;
        payloadKeys: string[];
    }): Promise<void>;
    deleteManyByIeeeAddr(ieeeAddr: string): Promise<number>;
    findMany(query: ListZigbeeDeviceLogsQuery): Promise<{
        items: ZigbeeDeviceLogEntry[];
        total: number;
    }>;
}
