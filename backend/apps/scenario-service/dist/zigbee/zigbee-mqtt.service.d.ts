import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ZigbeeIngestService } from './zigbee-ingest.service';
import { HouseMqttConfigRepository, HouseMqttConfig } from './house-mqtt-config.repository';
export declare class ZigbeeMqttService implements OnModuleInit, OnModuleDestroy {
    private readonly configRepo;
    private readonly ingest;
    private readonly logger;
    private readonly connections;
    constructor(configRepo: HouseMqttConfigRepository, ingest: ZigbeeIngestService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    connect(config: HouseMqttConfig): void;
    disconnectHouse(houseId: string): void;
    getConnectionStatus(houseId: string): {
        connected: boolean;
        url?: string;
    };
    getAllStatuses(): Record<string, {
        connected: boolean;
    }>;
    requestBridgeDeviceList(houseId: string): {
        ok: true;
    } | {
        ok: false;
        error: string;
    };
    permitJoin(houseId: string, enable: boolean, time?: number): {
        ok: true;
    } | {
        ok: false;
        error: string;
    };
    removeDevice(houseId: string, idOrName: string, force?: boolean): {
        ok: true;
    } | {
        ok: false;
        error: string;
    };
    sendDeviceCommand(houseId: string, topicName: string, payload: Record<string, unknown>): {
        ok: true;
        topic: string;
    } | {
        ok: false;
        error: string;
    };
    private logIncoming;
}
