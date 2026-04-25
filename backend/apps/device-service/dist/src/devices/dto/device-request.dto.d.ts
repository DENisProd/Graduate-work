import { DeviceStatus } from '../device-status.enum';
export declare class DeviceTranslationRequest {
    name: string;
    description?: string | null;
}
export declare class DeviceRequest {
    code: string;
    deviceCategoryId: number;
    status?: DeviceStatus;
    serialNumber?: string | null;
    firmwareVersion?: string | null;
    active?: boolean;
    isModerated?: boolean;
    translations: Record<string, DeviceTranslationRequest>;
}
