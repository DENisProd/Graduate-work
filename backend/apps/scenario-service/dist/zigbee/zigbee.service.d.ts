import { Subject } from 'rxjs';
import { DeviceDataService } from '../device-data/device-data.service';
import { ZigbeeDeviceLogSource } from '../mongo/schemas/zigbee-device-log.mongo';
import { ZigbeeDeviceLogRepository } from './zigbee-device-log.repository';
import { ZigbeeDevice, ZigbeeDeviceRepository } from './zigbee-device.repository';
import { ZigbeeLinkRepository } from './zigbee-link.repository';
import { ZigbeeMqttService } from './zigbee-mqtt.service';
import { ZigbeeRealtimeService } from './zigbee-realtime.service';
import { ZigbeeStateRepository } from './zigbee-state.repository';
import { type CreateZigbeeLinksBatchInput, type CreateZigbeeStateInput, type ListZigbeeDevicesQuery, type ListZigbeeLinksQuery, type ListZigbeeDeviceLogsQuery, type ListZigbeeStatesQuery, type UpsertZigbeeDeviceInput } from './schemas/zigbee.schemas';
export interface ZigbeePairingEvent {
    type: 'joined' | 'interview_started' | 'interview_done' | 'interview_failed';
    ieeeAddr: string;
    friendlyName: string;
    supported?: boolean;
    definition?: Record<string, unknown> | null;
    capabilities?: string[];
    physicalDeviceId?: string | null;
    model?: string | null;
    manufacturer?: string | null;
}
export interface ZigbeePairingStatus {
    permitJoin: boolean;
    timeout?: number | null;
}
export declare class ZigbeeService {
    private readonly devices;
    private readonly states;
    private readonly links;
    private readonly deviceLogs;
    private readonly realtime;
    private readonly deviceData;
    private readonly mqtt;
    readonly pairingEvents$: Subject<ZigbeePairingEvent>;
    readonly pairingStatus$: Subject<ZigbeePairingStatus>;
    private readonly recentlyDeleted;
    constructor(devices: ZigbeeDeviceRepository, states: ZigbeeStateRepository, links: ZigbeeLinkRepository, deviceLogs: ZigbeeDeviceLogRepository, realtime: ZigbeeRealtimeService, deviceData: DeviceDataService, mqtt: ZigbeeMqttService);
    private markDeleted;
    private isRecentlyDeleted;
    upsertDevice(input: UpsertZigbeeDeviceInput): Promise<ZigbeeDevice>;
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
        items: ZigbeeDevice[];
        total: number;
    }>;
    getDeviceByIeeeAddr(ieeeAddr: string): Promise<ZigbeeDevice | null>;
    listStates(query: ListZigbeeStatesQuery): Promise<{
        items: import("./zigbee-state.repository").ZigbeeDeviceState[];
        total: number;
    }>;
    listLinks(query: ListZigbeeLinksQuery): Promise<{
        items: import("./zigbee-link.repository").DeviceNetworkLink[];
        total: number;
    }>;
    permitJoin(enable: boolean, time?: number): {
        ok: true;
    } | {
        ok: false;
        error: string;
    };
    emitPairingStatus(status: ZigbeePairingStatus): void;
    applyBridgeEvent(payload: Record<string, unknown>): Promise<void>;
    syncDevicesFromZigbee2MqttBridge(list: unknown): Promise<void>;
    removeDevice(ieeeAddr: string, force?: boolean): Promise<{
        ok: true;
        device: ZigbeeDevice;
    } | {
        ok: false;
        error: string;
    }>;
    sendCommand(ieeeAddr: string, payload: Record<string, unknown>): Promise<{
        ok: true;
        topic: string;
    } | {
        ok: false;
        error: string;
    }>;
    ingestMqttDeviceState(topicSegment: string, payload: Record<string, unknown>): Promise<void>;
}
