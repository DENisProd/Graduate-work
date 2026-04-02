import { ZigbeeService } from './zigbee.service';
export declare class ZigbeeController {
    private readonly service;
    constructor(service: ZigbeeService);
    listDevices(query: unknown): Promise<{
        items: import("./zigbee-device.repository").ZigbeeDevice[];
        total: number;
    }>;
    getDevice(ieeeAddr: string): Promise<import("./zigbee-device.repository").ZigbeeDevice>;
    upsertDevice(body: unknown): Promise<import("./zigbee-device.repository").ZigbeeDevice>;
    createState(body: unknown): Promise<import("./zigbee-state.repository").ZigbeeDeviceState>;
    listStates(query: unknown): Promise<{
        items: import("./zigbee-state.repository").ZigbeeDeviceState[];
        total: number;
    }>;
    createLinksBatch(body: unknown): Promise<{
        items: import("./zigbee-link.repository").DeviceNetworkLink[];
        inserted: number;
    }>;
    listLinks(query: unknown): Promise<{
        items: import("./zigbee-link.repository").DeviceNetworkLink[];
        total: number;
    }>;
}
