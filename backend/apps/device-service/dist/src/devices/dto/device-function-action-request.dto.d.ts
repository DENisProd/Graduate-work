import { ActionType } from '@prisma/client';
export declare class DeviceFunctionActionTranslationRequest {
    name: string;
    description?: string | null;
}
export declare class DeviceFunctionActionRequest {
    code: string;
    deviceFunctionId: number;
    actionType: ActionType;
    payloadTemplate?: string | null;
    active?: boolean;
    translations: Record<string, DeviceFunctionActionTranslationRequest>;
}
