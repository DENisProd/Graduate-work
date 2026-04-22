import { ConfigService } from '@nestjs/config';
export interface CatalogDeviceType {
    id: number;
    code: string;
    name: string;
}
export interface CatalogDeviceCategory {
    id: number;
    code: string;
    name: string;
    deviceType?: CatalogDeviceType | null;
}
export interface CatalogDevice {
    id: number;
    code: string;
    name: string | null;
    category: CatalogDeviceCategory | null;
}
export declare class DeviceCatalogClient {
    private readonly logger;
    private readonly baseUrl;
    constructor(config: ConfigService);
    private get;
    private post;
    findDeviceByCode(code: string): Promise<CatalogDevice | null>;
    findDeviceTypeByCode(code: string): Promise<CatalogDeviceType | null>;
    findDeviceCategoryByCode(code: string): Promise<CatalogDeviceCategory | null>;
    createDeviceType(code: string, name: string): Promise<CatalogDeviceType | null>;
    createDeviceCategory(code: string, name: string, deviceTypeId: number): Promise<CatalogDeviceCategory | null>;
    createDevice(code: string, name: string, deviceCategoryId: number): Promise<CatalogDevice | null>;
    createDeviceFunction(code: string, name: string, deviceId: number, functionType?: 'READ' | 'WRITE' | 'READ_WRITE'): Promise<{
        id: number;
    } | null>;
}
