import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZigbeeIngestService } from './zigbee-ingest.service';
export declare class ZigbeeMqttService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly ingest;
    private readonly logger;
    private client;
    private topicPrefix;
    constructor(config: ConfigService, ingest: ZigbeeIngestService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    requestBridgeDeviceList(): {
        ok: true;
    } | {
        ok: false;
        error: string;
    };
    private maybeRequestBridgeDevicesAfterSubscribe;
    private logIncomingMqtt;
}
