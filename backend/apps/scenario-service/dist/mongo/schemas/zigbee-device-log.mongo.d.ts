import type { HydratedDocument } from 'mongoose';
export declare const ZIGBEE_DEVICE_LOG_MODEL = "ZigbeeDeviceLog";
export declare enum ZigbeeDeviceLogSource {
    Mqtt = "mqtt",
    Api = "api"
}
export declare enum ZigbeeDeviceLogKind {
    StateIngest = "state_ingest",
    BridgeEvent = "bridge_event"
}
export declare class ZigbeeDeviceLogModel {
    deviceIeeeAddr: string;
    physicalDeviceId?: string | null;
    timestamp: Date;
    source: ZigbeeDeviceLogSource;
    kind: ZigbeeDeviceLogKind;
    message?: string | null;
    metrics?: {
        state?: string | null;
        brightness?: number | null;
        linkquality?: number | null;
        colorMode?: string | null;
        occupancy?: boolean | null;
        temperature?: number | null;
        humidity?: number | null;
        battery?: number | null;
    } | null;
    payloadKeys?: string[];
    stateDocumentId?: string | null;
    metadata?: Record<string, unknown> | null;
}
export type ZigbeeDeviceLogDocument = HydratedDocument<ZigbeeDeviceLogModel>;
export declare const ZigbeeDeviceLogSchema: any;
