import { ZigbeeDeviceRepository } from './zigbee-device.repository';
import { ZigbeeLinkRepository } from './zigbee-link.repository';
import { ZigbeeStateRepository } from './zigbee-state.repository';
import type { CreateZigbeeLinksBatchInput, CreateZigbeeStateInput, ListZigbeeDevicesQuery, ListZigbeeLinksQuery, ListZigbeeStatesQuery, UpsertZigbeeDeviceInput } from './schemas/zigbee.schemas';
export declare class ZigbeeService {
    private readonly devices;
    private readonly states;
    private readonly links;
    constructor(devices: ZigbeeDeviceRepository, states: ZigbeeStateRepository, links: ZigbeeLinkRepository);
    upsertDevice(input: UpsertZigbeeDeviceInput): Promise<import("./zigbee-device.repository").ZigbeeDevice>;
    createState(input: CreateZigbeeStateInput): Promise<import("./zigbee-state.repository").ZigbeeDeviceState>;
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
}
