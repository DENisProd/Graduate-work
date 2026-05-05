import { DeviceCatalogClient } from './device-catalog.client';
import { LlmService } from '../llm/llm.service';
export interface DeviceCatalogSyncResult {
    deviceTypeId: number | null;
    deviceId: number | null;
    deviceCategoryId: number | null;
}
export declare class DeviceCatalogService {
    private readonly client;
    private readonly llm?;
    private readonly logger;
    constructor(client: DeviceCatalogClient, llm?: LlmService | undefined);
    syncWithCatalog(input: {
        model?: string | null;
        manufacturerName?: string | null;
        definition?: Record<string, unknown> | null;
        friendlyName?: string | null;
        ieeeAddr?: string | null;
    }): Promise<DeviceCatalogSyncResult>;
    private enrichWithLlm;
    private createFunctions;
    private buildCategoryCode;
    private buildDeviceCode;
    private pickDeviceName;
}
