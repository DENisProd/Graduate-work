import { DeviceDataService } from '../device-data/device-data.service';
import { ZigbeeDeviceLogSource } from '../mongo/schemas/zigbee-device-log.mongo';
import { ZigbeeDeviceLogRepository } from './zigbee-device-log.repository';
import { ZigbeeDeviceRepository } from './zigbee-device.repository';
import { ZigbeeLinkRepository } from './zigbee-link.repository';
import { ZigbeeRealtimeService } from './zigbee-realtime.service';
import { ZigbeeStateRepository } from './zigbee-state.repository';
import { type CreateZigbeeLinksBatchInput, type CreateZigbeeStateInput, type ListZigbeeDevicesQuery, type ListZigbeeLinksQuery, type ListZigbeeDeviceLogsQuery, type ListZigbeeStatesQuery, type UpsertZigbeeDeviceInput } from './schemas/zigbee.schemas';
export declare class ZigbeeService {
    private readonly devices;
    private readonly states;
    private readonly links;
    private readonly deviceLogs;
    private readonly realtime;
    private readonly deviceData;
    constructor(devices: ZigbeeDeviceRepository, states: ZigbeeStateRepository, links: ZigbeeLinkRepository, deviceLogs: ZigbeeDeviceLogRepository, realtime: ZigbeeRealtimeService, deviceData: DeviceDataService);
    upsertDevice(input: UpsertZigbeeDeviceInput): Promise<import("./zigbee-device.repository").ZigbeeDevice>;
    createState(input: CreateZigbeeStateInput, options?: {
        logSource?: ZigbeeDeviceLogSource;
    }): Promise<import("./zigbee-state.repository").ZigbeeDeviceState>;
    listDeviceLogs(query: ListZigbeeDeviceLogsQuery): Promise<{
        items: import("./zigbee-device-log.repository").ZigbeeDeviceLogEntry[];
        total: number;
    }>;
    createLinksBatch(input: CreateZigbeeLinksBatchInput): Promise<{
        items: import("./zigbee-link.repository").DeviceNetworkLink[];
        inserted: number;
    }>;
    listDevices(query: ListZigbeeDevicesQuery): Promise<{
        items: import("./zigbee-device.repository").ZigbeeDevice[];
        total: number;
    }>;
    getDeviceByIeeeAddr(ieeeAddr: string): Promise<import("./zigbee-device.repository").ZigbeeDevice | null>;
    listStates(query: ListZigbeeStatesQuery): Promise<{
        items: import("./zigbee-state.repository").ZigbeeDeviceState[];
        total: number;
    }>;
    listLinks(query: ListZigbeeLinksQuery): Promise<{
        items: import("./zigbee-link.repository").DeviceNetworkLink[];
        total: number;
    }>;
    applyBridgeEvent(payload: Record<string, unknown>): Promise<void>;
    syncDevicesFromZigbee2MqttBridge(list: unknown): Promise<void>;
    ingestMqttDeviceState(topicSegment: string, payload: Record<string, unknown>): Promise<void>;
}
