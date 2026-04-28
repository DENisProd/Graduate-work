import { z } from 'zod';
export declare enum ZigbeeDeviceType {
    Coordinator = "Coordinator",
    Router = "Router",
    EndDevice = "EndDevice"
}
export declare const zigbeeDeviceTypeSchema: any;
export declare enum Protocol {
    Zigbee = "Zigbee",
    ZWave = "ZWave",
    Matter = "Matter",
    WiFi = "WiFi",
    Bluetooth = "Bluetooth",
    Unknown = "Unknown"
}
export declare const protocolSchema: any;
export declare const upsertZigbeeDeviceSchema: any;
export type UpsertZigbeeDeviceInput = z.infer<typeof upsertZigbeeDeviceSchema>;
export declare const createZigbeeStateSchema: any;
export type CreateZigbeeStateInput = z.infer<typeof createZigbeeStateSchema>;
export declare const createZigbeeLinksBatchSchema: any;
export type CreateZigbeeLinksBatchInput = z.infer<typeof createZigbeeLinksBatchSchema>;
export declare const listZigbeeDevicesQuerySchema: any;
export type ListZigbeeDevicesQuery = z.infer<typeof listZigbeeDevicesQuerySchema>;
export declare const listZigbeeStatesQuerySchema: any;
export type ListZigbeeStatesQuery = z.infer<typeof listZigbeeStatesQuerySchema>;
export declare const listZigbeeLinksQuerySchema: any;
export type ListZigbeeLinksQuery = z.infer<typeof listZigbeeLinksQuerySchema>;
export declare const zigbeeDeviceLogKindSchema: any;
export declare const zigbeeDeviceLogSourceSchema: any;
export declare const listZigbeeDeviceLogsQuerySchema: any;
export type ListZigbeeDeviceLogsQuery = z.infer<typeof listZigbeeDeviceLogsQuerySchema>;
export declare const zigbeeSocketSubscribeSchema: any;
export type ZigbeeSocketSubscribePayload = z.infer<typeof zigbeeSocketSubscribeSchema>;
export declare const zigbeeCommandSchema: any;
export type ZigbeeCommandInput = z.infer<typeof zigbeeCommandSchema>;
export declare const zigbeeSocketCommandSchema: any;
export type ZigbeeSocketCommandPayload = z.infer<typeof zigbeeSocketCommandSchema>;
