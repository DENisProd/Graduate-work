declare const UpdatePhysicalDeviceDto_base: import("nestjs-zod").ZodDto<{
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
}, import("zod").ZodObjectDef<{
    name: import("zod").ZodOptional<import("zod").ZodString>;
    description: import("zod").ZodOptional<import("zod").ZodOptional<import("zod").ZodString>>;
    deviceTypeId: import("zod").ZodOptional<import("zod").ZodOptional<import("zod").ZodNumber>>;
    houseId: import("zod").ZodOptional<import("zod").ZodString>;
    deviceId: import("zod").ZodOptional<import("zod").ZodOptional<import("zod").ZodNumber>>;
    deviceCategoryId: import("zod").ZodOptional<import("zod").ZodOptional<import("zod").ZodNumber>>;
    roomId: import("zod").ZodOptional<import("zod").ZodOptional<import("zod").ZodString>>;
    firmwareVersion: import("zod").ZodOptional<import("zod").ZodOptional<import("zod").ZodString>>;
    ipAddress: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodOptional<import("zod").ZodString>, import("zod").ZodLiteral<"">]>>;
    macAddress: import("zod").ZodOptional<import("zod").ZodOptional<import("zod").ZodString>>;
    serialNumber: import("zod").ZodOptional<import("zod").ZodOptional<import("zod").ZodString>>;
}, "strip", import("zod").ZodTypeAny>, {
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
export declare class UpdatePhysicalDeviceDto extends UpdatePhysicalDeviceDto_base {
}
export {};
