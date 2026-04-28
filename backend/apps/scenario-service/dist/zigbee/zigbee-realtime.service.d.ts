import type { ZigbeeDeviceState } from './zigbee-state.repository';
export type ZigbeeStateRealtimePayload = {
    deviceIeeeAddr: string;
    physicalDeviceId?: string | null;
    friendlyName?: string | null;
    timestamp: Date;
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
};
export declare class ZigbeeRealtimeService {
    private readonly stateSubject;
    readonly stateUpdates$: any;
    publishStateUpdate(state: ZigbeeDeviceState, meta: {
        physicalDeviceId?: string | null;
        friendlyName?: string | null;
        payload: Record<string, unknown>;
    }): void;
}
