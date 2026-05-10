import { z } from 'zod';
export declare const createDeviceDataSchema: z.ZodObject<{
    deviceId: z.ZodString;
    capability: z.ZodString;
    attribute: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof import("../../common/schemas/enums").DeviceDataType>;
    value: z.ZodUnknown;
    unit: z.ZodOptional<z.ZodString>;
    quality: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    deviceId: string;
    capability: string;
    type: import("../../common/schemas/enums").DeviceDataType;
    attribute?: string | undefined;
    value?: unknown;
    unit?: string | undefined;
    quality?: number | undefined;
    timestamp?: Date | undefined;
}, {
    deviceId: string;
    capability: string;
    type: import("../../common/schemas/enums").DeviceDataType;
    attribute?: string | undefined;
    value?: unknown;
    unit?: string | undefined;
    quality?: number | undefined;
    timestamp?: Date | undefined;
}>;
export type CreateDeviceDataInput = z.infer<typeof createDeviceDataSchema>;
export declare const deviceDataSeriesRangeSchema: z.ZodEnum<["1m", "1h", "6h", "24h", "7d"]>;
export type DeviceDataSeriesRange = z.infer<typeof deviceDataSeriesRangeSchema>;
export declare const listDeviceDataQuerySchema: z.ZodObject<{
    deviceId: z.ZodOptional<z.ZodString>;
    capability: z.ZodOptional<z.ZodString>;
    attribute: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof import("../../common/schemas/enums").DeviceDataType>>;
    from: z.ZodOptional<z.ZodEffects<z.ZodDate, Date, unknown>>;
    to: z.ZodOptional<z.ZodEffects<z.ZodDate, Date, unknown>>;
} & {
    page: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    deviceId?: string | undefined;
    capability?: string | undefined;
    attribute?: string | undefined;
    type?: import("../../common/schemas/enums").DeviceDataType | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
}, {
    deviceId?: string | undefined;
    capability?: string | undefined;
    attribute?: string | undefined;
    type?: import("../../common/schemas/enums").DeviceDataType | undefined;
    from?: unknown;
    to?: unknown;
    page?: unknown;
    limit?: unknown;
}>;
export type ListDeviceDataQuery = z.infer<typeof listDeviceDataQuerySchema>;
export declare const deviceDataSeriesQuerySchema: z.ZodObject<{
    deviceId: z.ZodString;
    range: z.ZodEnum<["1m", "1h", "6h", "24h", "7d"]>;
    capabilities: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodEffects<z.ZodDate, Date, unknown>>;
}, "strip", z.ZodTypeAny, {
    deviceId: string;
    range: "1m" | "1h" | "6h" | "24h" | "7d";
    to?: Date | undefined;
    capabilities?: string | undefined;
}, {
    deviceId: string;
    range: "1m" | "1h" | "6h" | "24h" | "7d";
    to?: unknown;
    capabilities?: string | undefined;
}>;
export type DeviceDataSeriesQuery = z.infer<typeof deviceDataSeriesQuerySchema>;
