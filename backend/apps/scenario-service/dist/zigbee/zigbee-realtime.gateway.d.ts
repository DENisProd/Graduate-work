import { OnGatewayInit } from '@nestjs/websockets';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { ZigbeeRealtimeService } from './zigbee-realtime.service';
import { ZigbeeService } from './zigbee.service';
import { ZigbeeStateRepository } from './zigbee-state.repository';
import { ZigbeeDeviceRepository } from './zigbee-device.repository';
export declare class ZigbeeRealtimeGateway implements OnModuleInit, OnModuleDestroy, OnGatewayInit {
    private readonly realtime;
    private readonly states;
    private readonly devices;
    private readonly zigbee;
    private readonly logger;
    private sub?;
    private pairingSub?;
    private pairingStatusSub?;
    server: Server;
    constructor(realtime: ZigbeeRealtimeService, states: ZigbeeStateRepository, devices: ZigbeeDeviceRepository, zigbee: ZigbeeService);
    onModuleInit(): void;
    afterInit(): void;
    onModuleDestroy(): void;
    private emitState;
    private toWire;
    private emitExistingDevicesToClient;
    private resolveIeeeList;
    onSubscribe(client: Socket, body: unknown): Promise<{
        ok: false;
        error: string;
        subscribed?: undefined;
        snapshots?: undefined;
    } | {
        ok: true;
        subscribed: number;
        snapshots: {
            deviceIeeeAddr: string;
            physicalDeviceId: string | null;
            friendlyName: string | null;
            timestamp: string;
            metrics: {
                state?: string | null;
                brightness?: number | null;
                linkquality?: number | null;
                colorMode?: string | null;
                occupancy?: boolean | null;
                temperature?: number | null;
                humidity?: number | null;
                battery?: number | null;
            };
            payload: Record<string, unknown>;
            stateId: string;
        }[];
        error?: undefined;
    }>;
    onCommand(_client: Socket, body: unknown): Promise<{
        ok: true;
        topic: string;
    } | {
        ok: false;
        error: string;
    }>;
    onPairingWatch(client: Socket): Promise<{
        ok: true;
    }>;
    onPairingUnwatch(client: Socket): Promise<{
        ok: true;
    }>;
    onPairingStart(client: Socket, body: unknown): Promise<{
        ok: false;
        error: string;
        time?: undefined;
    } | {
        ok: true;
        time: number;
        error?: undefined;
    }>;
    onPairingStop(client: Socket): Promise<{
        ok: false;
        error: string;
    } | {
        ok: true;
        error?: undefined;
    }>;
    onUnsubscribe(client: Socket, body: unknown): Promise<{
        ok: true;
        left: string;
        error?: undefined;
    } | {
        ok: false;
        error: string;
        left?: undefined;
    } | {
        ok: true;
        left: number;
        error?: undefined;
    }>;
}
