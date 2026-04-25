import { DeviceCatalogClient } from './device-catalog.client';
export interface DeviceCatalogSyncResult {
    deviceTypeId: number | null;
    deviceId: number | null;
    deviceCategoryId: number | null;
}
export declare class DeviceCatalogService {
    private readonly client;
    private readonly logger;
    constructor(client: DeviceCatalogClient);
    syncWithCatalog(input: {
        model?: string | null;
        manufacturerName?: string | null;
        definition?: Record<string, unknown> | null;
        friendlyName?: string | null;
        ieeeAddr?: string | null;
    }): Promise<DeviceCatalogSyncResult>;
    private buildCategoryCode;
    private buildDeviceCode;
    private pickDeviceName;
}
