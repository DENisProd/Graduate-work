import { DeviceStatus } from '../device-status.enum';
import { DeviceFunctionType } from '@prisma/client';
import { ActionType } from '@prisma/client';
export interface TranslationResponse {
    name: string;
    description?: string | null;
}
export interface DeviceTypeResponse {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date | null;
    translations?: Record<string, TranslationResponse> | null;
}
export interface DeviceCategoryResponse {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    deviceType?: DeviceTypeResponse | null;
    active: boolean;
    isModerated: boolean;
    createdAt: Date;
    updatedAt: Date | null;
    translations?: Record<string, TranslationResponse> | null;
}
export interface DeviceFunctionActionResponse {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    deviceFunctionId: number;
    actionType: ActionType;
    payloadTemplate?: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date | null;
    translations?: Record<string, TranslationResponse> | null;
}
export interface DeviceFunctionResponse {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    deviceId: number;
    functionType: DeviceFunctionType;
    currentValue?: string | null;
    minValue?: number | null;
    maxValue?: number | null;
    unit?: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date | null;
    actions?: DeviceFunctionActionResponse[] | null;
    translations?: Record<string, TranslationResponse> | null;
}
export interface DeviceResponse {
    id: number;
    code: string;
    name: string | null;
    description: string | null;
    category: DeviceCategoryResponse | null;
    status: DeviceStatus;
    online: boolean;
    serialNumber?: string | null;
    firmwareVersion?: string | null;
    active: boolean;
    isModerated: boolean;
    lastSeenAt: Date | null;
    createdAt: Date;
    updatedAt: Date | null;
    functions?: DeviceFunctionResponse[] | null;
    translations?: Record<string, TranslationResponse> | null;
}
