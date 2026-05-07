import { ZigbeeService } from './zigbee.service';
import { ZigbeeMqttService } from './zigbee-mqtt.service';
import { HouseMqttConfigRepository } from './house-mqtt-config.repository';
export declare class ZigbeeController {
    private readonly service;
    private readonly zigbeeMqtt;
    private readonly mqttConfigRepo;
    constructor(service: ZigbeeService, zigbeeMqtt: ZigbeeMqttService, mqttConfigRepo: HouseMqttConfigRepository);
    listDevices(query: unknown): Promise<{
        items: import("./zigbee-device.repository").ZigbeeDevice[];
        total: number;
    }>;
    getDevice(ieeeAddr: string): Promise<import("./zigbee-device.repository").ZigbeeDevice>;
    removeDevice(ieeeAddr: string, force?: string): Promise<{
        ok: boolean;
        deleted: import("./zigbee-device.repository").ZigbeeDevice;
    }>;
    sendCommand(ieeeAddr: string, body: unknown): Promise<{
        ok: boolean;
        topic: string;
    }>;
    requestDevicesSyncFromBridge(houseId: string): {
        ok: boolean;
        message: string;
    };
    upsertDevice(body: unknown): Promise<import("./zigbee-device.repository").ZigbeeDevice>;
    permitJoin(body: unknown): {
        ok: boolean;
        enable: boolean;
        time: number | undefined;
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
    listHouseMqttConfigs(): Promise<{
        status: {
            connected: boolean;
            url?: string;
        };
        houseId: string;
        mqttUrl: string;
        mqttUsername?: string;
        topicPrefix: string;
        enabled: boolean;
    }[]>;
    getMqttStatuses(): Record<string, {
        connected: boolean;
    }>;
    getHouseMqttConfig(houseId: string): Promise<{
        status: {
            connected: boolean;
            url?: string;
        };
        houseId: string;
        mqttUrl: string;
        mqttUsername?: string;
        topicPrefix: string;
        enabled: boolean;
    }>;
    upsertHouseMqttConfig(houseId: string, body: unknown): Promise<{
        status: {
            connected: boolean;
            url?: string;
        };
        houseId: string;
        mqttUrl: string;
        mqttUsername?: string;
        topicPrefix: string;
        enabled: boolean;
    }>;
    deleteHouseMqttConfig(houseId: string): Promise<{
        ok: boolean;
        houseId: string;
    }>;
    reconnectHouseMqtt(houseId: string): Promise<{
        ok: boolean;
        houseId: string;
    }>;
}
