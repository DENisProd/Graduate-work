import { DeviceCatalogClient } from './device-catalog.client';
export interface DeviceCatalogSyncResult {
    deviceTypeId: number | null;
    abstractDeviceId: number | null;
}
export declare class DeviceCatalogService {
    private readonly client;
    private readonly logger;
    constructor(client: DeviceCatalogClient);
    syncWithCatalog(input: {
        model?: string | null;
        manufacturerName?: string | null;
        capabilities?: string[];
    }): Promise<DeviceCatalogSyncResult>;
    private resolveTypeId;
    private findOrCreateDeviceType;
    private findOrCreateCategory;
    private buildCategoryCode;
    private createFunctions;
}
