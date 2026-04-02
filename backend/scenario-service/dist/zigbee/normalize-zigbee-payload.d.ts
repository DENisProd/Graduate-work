export type ZigbeeNormalized = {
    state?: string;
    brightness?: number;
    linkquality?: number;
    colorMode?: string;
    occupancy?: boolean;
    temperature?: number;
    humidity?: number;
    battery?: number;
};
export declare function normalizeZigbeePayload(payload: Record<string, unknown>): ZigbeeNormalized;
