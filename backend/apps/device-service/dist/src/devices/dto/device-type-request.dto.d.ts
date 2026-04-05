export declare class DeviceTypeTranslationRequest {
    name: string;
    description?: string | null;
}
export declare class DeviceTypeRequest {
    code: string;
    active?: boolean;
    translations: Record<string, DeviceTypeTranslationRequest>;
}
