declare const CreatePhysicalDeviceDto_base: import("nestjs-zod").ZodDto<{
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
}, import("zod").ZodObjectDef<{
    name: import("zod").ZodString;
    description: import("zod").ZodOptional<import("zod").ZodString>;
    deviceTypeId: import("zod").ZodOptional<import("zod").ZodNumber>;
    houseId: import("zod").ZodString;
    deviceId: import("zod").ZodOptional<import("zod").ZodNumber>;
    deviceCategoryId: import("zod").ZodOptional<import("zod").ZodNumber>;
    roomId: import("zod").ZodOptional<import("zod").ZodString>;
    firmwareVersion: import("zod").ZodOptional<import("zod").ZodString>;
    ipAddress: import("zod").ZodUnion<[import("zod").ZodOptional<import("zod").ZodString>, import("zod").ZodLiteral<"">]>;
    macAddress: import("zod").ZodOptional<import("zod").ZodString>;
    serialNumber: import("zod").ZodOptional<import("zod").ZodString>;
}, "strip", import("zod").ZodTypeAny>, {
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
export declare class CreatePhysicalDeviceDto extends CreatePhysicalDeviceDto_base {
}
export {};
