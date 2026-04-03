import { DeviceFunctionType } from '@prisma/client';
export declare class DeviceFunctionTranslationRequest {
    name: string;
    description?: string | null;
}
export declare class DeviceFunctionRequest {
    code: string;
    deviceId: number;
    functionType: DeviceFunctionType;
    currentValue?: string | null;
    minValue?: number | null;
    maxValue?: number | null;
    unit?: string | null;
    active?: boolean;
    translations: Record<string, DeviceFunctionTranslationRequest>;
}
