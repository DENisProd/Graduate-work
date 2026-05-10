import { z } from 'zod';
export declare const createPhysicalDeviceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    deviceTypeId: z.ZodOptional<z.ZodNumber>;
    houseId: z.ZodString;
    deviceId: z.ZodOptional<z.ZodNumber>;
    deviceCategoryId: z.ZodOptional<z.ZodNumber>;
    roomId: z.ZodOptional<z.ZodString>;
    firmwareVersion: z.ZodOptional<z.ZodString>;
    ipAddress: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    macAddress: z.ZodOptional<z.ZodString>;
    serialNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    houseId: string;
    description?: string | undefined;
    deviceTypeId?: number | undefined;
    deviceId?: number | undefined;
    deviceCategoryId?: number | undefined;
    roomId?: string | undefined;
    firmwareVersion?: string | undefined;
    ipAddress?: string | undefined;
    macAddress?: string | undefined;
    serialNumber?: string | undefined;
}, {
    name: string;
    houseId: string;
    description?: string | undefined;
    deviceTypeId?: number | undefined;
    deviceId?: number | undefined;
    deviceCategoryId?: number | undefined;
    roomId?: string | undefined;
    firmwareVersion?: string | undefined;
    ipAddress?: string | undefined;
    macAddress?: string | undefined;
    serialNumber?: string | undefined;
}>;
export type CreatePhysicalDeviceInput = z.infer<typeof createPhysicalDeviceSchema>;
export declare const updatePhysicalDeviceSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    deviceTypeId: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    houseId: z.ZodOptional<z.ZodString>;
    deviceId: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    deviceCategoryId: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    roomId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    firmwareVersion: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    ipAddress: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    macAddress: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    serialNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    deviceTypeId?: number | undefined;
    houseId?: string | undefined;
    deviceId?: number | undefined;
    deviceCategoryId?: number | undefined;
    roomId?: string | undefined;
    firmwareVersion?: string | undefined;
    ipAddress?: string | undefined;
    macAddress?: string | undefined;
    serialNumber?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    deviceTypeId?: number | undefined;
    houseId?: string | undefined;
    deviceId?: number | undefined;
    deviceCategoryId?: number | undefined;
    roomId?: string | undefined;
    firmwareVersion?: string | undefined;
    ipAddress?: string | undefined;
    macAddress?: string | undefined;
    serialNumber?: string | undefined;
}>;
export type UpdatePhysicalDeviceInput = z.infer<typeof updatePhysicalDeviceSchema>;
export declare const listPhysicalDevicesQuerySchema: z.ZodObject<{
    houseId: z.ZodOptional<z.ZodString>;
    roomId: z.ZodOptional<z.ZodString>;
} & {
    page: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    houseId?: string | undefined;
    roomId?: string | undefined;
}, {
    houseId?: string | undefined;
    roomId?: string | undefined;
    page?: unknown;
    limit?: unknown;
}>;
export type ListPhysicalDevicesQuery = z.infer<typeof listPhysicalDevicesQuerySchema>;
