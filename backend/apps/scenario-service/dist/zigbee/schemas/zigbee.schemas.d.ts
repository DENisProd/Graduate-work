import { z } from 'zod';
export declare enum ZigbeeDeviceType {
    Coordinator = "Coordinator",
    Router = "Router",
    EndDevice = "EndDevice"
}
export declare const zigbeeDeviceTypeSchema: z.ZodNativeEnum<typeof ZigbeeDeviceType>;
export declare enum Protocol {
    Zigbee = "Zigbee",
    ZWave = "ZWave",
    Matter = "Matter",
    WiFi = "WiFi",
    Bluetooth = "Bluetooth",
    Unknown = "Unknown"
}
export declare const protocolSchema: z.ZodNativeEnum<typeof Protocol>;
export declare const upsertZigbeeDeviceSchema: z.ZodObject<{
    ieeeAddr: z.ZodString;
    networkAddress: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof ZigbeeDeviceType>>;
    manufacturerName: z.ZodOptional<z.ZodString>;
    modelId: z.ZodOptional<z.ZodString>;
    friendlyName: z.ZodOptional<z.ZodString>;
    lastSeen: z.ZodOptional<z.ZodDate>;
    definition: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    ieeeAddr: string;
    type?: ZigbeeDeviceType | undefined;
    networkAddress?: number | undefined;
    manufacturerName?: string | undefined;
    modelId?: string | undefined;
    friendlyName?: string | undefined;
    lastSeen?: Date | undefined;
    definition?: Record<string, unknown> | undefined;
    capabilities?: string[] | undefined;
}, {
    ieeeAddr: string;
    type?: ZigbeeDeviceType | undefined;
    networkAddress?: number | undefined;
    manufacturerName?: string | undefined;
    modelId?: string | undefined;
    friendlyName?: string | undefined;
    lastSeen?: Date | undefined;
    definition?: Record<string, unknown> | undefined;
    capabilities?: string[] | undefined;
}>;
export type UpsertZigbeeDeviceInput = z.infer<typeof upsertZigbeeDeviceSchema>;
export declare const createZigbeeStateSchema: z.ZodObject<{
    deviceIeeeAddr: z.ZodString;
    timestamp: z.ZodOptional<z.ZodDate>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    state: z.ZodOptional<z.ZodString>;
    brightness: z.ZodOptional<z.ZodNumber>;
    linkquality: z.ZodOptional<z.ZodNumber>;
    colorMode: z.ZodOptional<z.ZodString>;
    occupancy: z.ZodOptional<z.ZodBoolean>;
    temperature: z.ZodOptional<z.ZodNumber>;
    humidity: z.ZodOptional<z.ZodNumber>;
    battery: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    deviceIeeeAddr: string;
    payload: Record<string, unknown>;
    timestamp?: Date | undefined;
    state?: string | undefined;
    brightness?: number | undefined;
    linkquality?: number | undefined;
    colorMode?: string | undefined;
    occupancy?: boolean | undefined;
    temperature?: number | undefined;
    humidity?: number | undefined;
    battery?: number | undefined;
}, {
    deviceIeeeAddr: string;
    payload: Record<string, unknown>;
    timestamp?: Date | undefined;
    state?: string | undefined;
    brightness?: number | undefined;
    linkquality?: number | undefined;
    colorMode?: string | undefined;
    occupancy?: boolean | undefined;
    temperature?: number | undefined;
    humidity?: number | undefined;
    battery?: number | undefined;
}>;
export type CreateZigbeeStateInput = z.infer<typeof createZigbeeStateSchema>;
export declare const createZigbeeLinksBatchSchema: z.ZodObject<{
    collectedAt: z.ZodOptional<z.ZodDate>;
    links: z.ZodArray<z.ZodObject<{
        sourceDeviceId: z.ZodString;
        targetDeviceId: z.ZodString;
        protocol: z.ZodDefault<z.ZodNativeEnum<typeof Protocol>>;
        linkQuality: z.ZodOptional<z.ZodNumber>;
        rssi: z.ZodOptional<z.ZodNumber>;
        lqi: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        sourceDeviceId: string;
        targetDeviceId: string;
        protocol: Protocol;
        linkQuality?: number | undefined;
        rssi?: number | undefined;
        lqi?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        sourceDeviceId: string;
        targetDeviceId: string;
        protocol?: Protocol | undefined;
        linkQuality?: number | undefined;
        rssi?: number | undefined;
        lqi?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    links: {
        sourceDeviceId: string;
        targetDeviceId: string;
        protocol: Protocol;
        linkQuality?: number | undefined;
        rssi?: number | undefined;
        lqi?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[];
    collectedAt?: Date | undefined;
}, {
    links: {
        sourceDeviceId: string;
        targetDeviceId: string;
        protocol?: Protocol | undefined;
        linkQuality?: number | undefined;
        rssi?: number | undefined;
        lqi?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }[];
    collectedAt?: Date | undefined;
}>;
export type CreateZigbeeLinksBatchInput = z.infer<typeof createZigbeeLinksBatchSchema>;
export declare const listZigbeeDevicesQuerySchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof ZigbeeDeviceType>>;
    houseId: z.ZodOptional<z.ZodString>;
} & {
    page: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    type?: ZigbeeDeviceType | undefined;
    houseId?: string | undefined;
    q?: string | undefined;
}, {
    type?: ZigbeeDeviceType | undefined;
    page?: unknown;
    limit?: unknown;
    houseId?: string | undefined;
    q?: string | undefined;
}>;
export type ListZigbeeDevicesQuery = z.infer<typeof listZigbeeDevicesQuerySchema>;
export declare const listZigbeeStatesQuerySchema: z.ZodObject<{
    deviceIeeeAddr: z.ZodString;
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
} & {
    page: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
} & {
    limit: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    deviceIeeeAddr: string;
    from?: Date | undefined;
    to?: Date | undefined;
}, {
    deviceIeeeAddr: string;
    page?: unknown;
    limit?: unknown;
    from?: Date | undefined;
    to?: Date | undefined;
}>;
export type ListZigbeeStatesQuery = z.infer<typeof listZigbeeStatesQuerySchema>;
export declare const listZigbeeLinksQuerySchema: z.ZodObject<{
    sourceDeviceId: z.ZodOptional<z.ZodString>;
    protocol: z.ZodOptional<z.ZodNativeEnum<typeof Protocol>>;
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
} & {
    page: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
} & {
    limit: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sourceDeviceId?: string | undefined;
    protocol?: Protocol | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
}, {
    page?: unknown;
    limit?: unknown;
    sourceDeviceId?: string | undefined;
    protocol?: Protocol | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
}>;
export type ListZigbeeLinksQuery = z.infer<typeof listZigbeeLinksQuerySchema>;
export declare const zigbeeDeviceLogKindSchema: z.ZodEnum<["state_ingest", "bridge_event"]>;
export declare const zigbeeDeviceLogSourceSchema: z.ZodEnum<["mqtt", "api"]>;
export declare const listZigbeeDeviceLogsQuerySchema: z.ZodObject<{
    deviceIeeeAddr: z.ZodOptional<z.ZodString>;
    physicalDeviceId: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
    kind: z.ZodOptional<z.ZodEnum<["state_ingest", "bridge_event"]>>;
    source: z.ZodOptional<z.ZodEnum<["mqtt", "api"]>>;
} & {
    page: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
} & {
    limit: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    deviceIeeeAddr?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
    physicalDeviceId?: string | undefined;
    kind?: "state_ingest" | "bridge_event" | undefined;
    source?: "mqtt" | "api" | undefined;
}, {
    page?: unknown;
    limit?: unknown;
    deviceIeeeAddr?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
    physicalDeviceId?: string | undefined;
    kind?: "state_ingest" | "bridge_event" | undefined;
    source?: "mqtt" | "api" | undefined;
}>;
export type ListZigbeeDeviceLogsQuery = z.infer<typeof listZigbeeDeviceLogsQuerySchema>;
export declare const zigbeeSocketSubscribeSchema: z.ZodEffects<z.ZodObject<{
    deviceIeeeAddrs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    physicalDeviceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    deviceIeeeAddrs?: string[] | undefined;
    physicalDeviceIds?: string[] | undefined;
}, {
    deviceIeeeAddrs?: string[] | undefined;
    physicalDeviceIds?: string[] | undefined;
}>, {
    deviceIeeeAddrs?: string[] | undefined;
    physicalDeviceIds?: string[] | undefined;
}, {
    deviceIeeeAddrs?: string[] | undefined;
    physicalDeviceIds?: string[] | undefined;
}>;
export type ZigbeeSocketSubscribePayload = z.infer<typeof zigbeeSocketSubscribeSchema>;
export declare const zigbeeCommandSchema: z.ZodObject<{
    payload: z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodUnknown>, Record<string, unknown>, Record<string, unknown>>;
}, "strip", z.ZodTypeAny, {
    payload: Record<string, unknown>;
}, {
    payload: Record<string, unknown>;
}>;
export type ZigbeeCommandInput = z.infer<typeof zigbeeCommandSchema>;
export declare const zigbeeSocketCommandSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    deviceIeeeAddr: z.ZodOptional<z.ZodString>;
    physicalDeviceId: z.ZodOptional<z.ZodString>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    payload: Record<string, unknown>;
    deviceIeeeAddr?: string | undefined;
    physicalDeviceId?: string | undefined;
}, {
    payload: Record<string, unknown>;
    deviceIeeeAddr?: string | undefined;
    physicalDeviceId?: string | undefined;
}>, {
    payload: Record<string, unknown>;
    deviceIeeeAddr?: string | undefined;
    physicalDeviceId?: string | undefined;
}, {
    payload: Record<string, unknown>;
    deviceIeeeAddr?: string | undefined;
    physicalDeviceId?: string | undefined;
}>, {
    payload: Record<string, unknown>;
    deviceIeeeAddr?: string | undefined;
    physicalDeviceId?: string | undefined;
}, {
    payload: Record<string, unknown>;
    deviceIeeeAddr?: string | undefined;
    physicalDeviceId?: string | undefined;
}>;
export type ZigbeeSocketCommandPayload = z.infer<typeof zigbeeSocketCommandSchema>;
