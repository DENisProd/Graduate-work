export declare class DeviceCategoryTranslationRequest {
    name: string;
    description?: string | null;
}
export declare class DeviceCategoryRequest {
    code: string;
    deviceTypeId: number;
    active?: boolean;
    translations: Record<string, DeviceCategoryTranslationRequest>;
}
