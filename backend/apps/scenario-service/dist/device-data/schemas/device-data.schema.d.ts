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
    type: import("../../common/schemas/enums").DeviceDataType;
    deviceId: string;
    capability: string;
    value?: unknown;
    timestamp?: Date | undefined;
    attribute?: string | undefined;
    unit?: string | undefined;
    quality?: number | undefined;
}, {
    type: import("../../common/schemas/enums").DeviceDataType;
    deviceId: string;
    capability: string;
    value?: unknown;
    timestamp?: Date | undefined;
    attribute?: string | undefined;
    unit?: string | undefined;
    quality?: number | undefined;
}>;
export type CreateDeviceDataInput = z.infer<typeof createDeviceDataSchema>;
export declare const listDeviceDataQuerySchema: z.ZodObject<{
    deviceId: z.ZodOptional<z.ZodString>;
    capability: z.ZodOptional<z.ZodString>;
    attribute: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof import("../../common/schemas/enums").DeviceDataType>>;
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
} & {
    page: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    type?: import("../../common/schemas/enums").DeviceDataType | undefined;
    deviceId?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
    capability?: string | undefined;
    attribute?: string | undefined;
}, {
    type?: import("../../common/schemas/enums").DeviceDataType | undefined;
    page?: unknown;
    limit?: unknown;
    deviceId?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
    capability?: string | undefined;
    attribute?: string | undefined;
}>;
export type ListDeviceDataQuery = z.infer<typeof listDeviceDataQuerySchema>;
