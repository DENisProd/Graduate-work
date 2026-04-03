declare const CreateDeviceDataDto_base: import("nestjs-zod").ZodDto<{
    type: import("../../common/schemas").DeviceDataType;
    deviceId: string;
    capability: string;
    value?: unknown;
    timestamp?: Date | undefined;
    attribute?: string | undefined;
    unit?: string | undefined;
    quality?: number | undefined;
}, import("zod").ZodObjectDef<{
    deviceId: import("zod").ZodString;
    capability: import("zod").ZodString;
    attribute: import("zod").ZodOptional<import("zod").ZodString>;
    type: import("zod").ZodNativeEnum<typeof import("../../common/schemas").DeviceDataType>;
    value: import("zod").ZodUnknown;
    unit: import("zod").ZodOptional<import("zod").ZodString>;
    quality: import("zod").ZodOptional<import("zod").ZodNumber>;
    timestamp: import("zod").ZodOptional<import("zod").ZodDate>;
}, "strip", import("zod").ZodTypeAny>, {
    type: import("../../common/schemas").DeviceDataType;
    deviceId: string;
    capability: string;
    value?: unknown;
    timestamp?: Date | undefined;
    attribute?: string | undefined;
    unit?: string | undefined;
    quality?: number | undefined;
}>;
export declare class CreateDeviceDataDto extends CreateDeviceDataDto_base {
}
export {};
