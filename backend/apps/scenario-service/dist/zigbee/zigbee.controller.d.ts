import { ZigbeeService } from './zigbee.service';
import { ZigbeeMqttService } from './zigbee-mqtt.service';
export declare class ZigbeeController {
    private readonly service;
    private readonly zigbeeMqtt;
    constructor(service: ZigbeeService, zigbeeMqtt: ZigbeeMqttService);
    listDevices(query: unknown): Promise<{
        items: import("./zigbee-device.repository").ZigbeeDevice[];
        total: number;
    }>;
    getDevice(ieeeAddr: string): Promise<import("./zigbee-device.repository").ZigbeeDevice>;
    upsertDevice(body: unknown): Promise<import("./zigbee-device.repository").ZigbeeDevice>;
    requestDevicesSyncFromBridge(): {
        ok: boolean;
        message: string;
    };
    createState(body: unknown): Promise<import("./zigbee-state.repository").ZigbeeDeviceState>;
    listStates(query: unknown): Promise<{
        items: import("./zigbee-state.repository").ZigbeeDeviceState[];
        total: number;
    }>;
    listDeviceLogs(query: unknown): Promise<{
        items: import("./zigbee-device-log.repository").ZigbeeDeviceLogEntry[];
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
