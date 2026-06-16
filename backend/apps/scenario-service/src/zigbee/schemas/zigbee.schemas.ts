import { z } from 'zod';
import { paginationQuerySchema } from '../../common/schemas/pagination';

export enum ZigbeeDeviceType {
  Coordinator = 'Coordinator',
  Router = 'Router',
  EndDevice = 'EndDevice',
}
export const zigbeeDeviceTypeSchema = z.nativeEnum(ZigbeeDeviceType);

export enum Protocol {
  Zigbee = 'Zigbee',
  ZWave = 'ZWave',
  Matter = 'Matter',
  WiFi = 'WiFi',
  Bluetooth = 'Bluetooth',
  Unknown = 'Unknown',
}
export const protocolSchema = z.nativeEnum(Protocol);

export const upsertZigbeeDeviceSchema = z.object({
  ieeeAddr: z.string().min(3).max(64),
  houseId: z.string().min(1).max(255).optional(),
  networkAddress: z.coerce.number().int().min(0).optional(),
  type: zigbeeDeviceTypeSchema.optional(),
  manufacturerName: z.string().max(255).optional(),
  modelId: z.string().max(255).optional(),
  deviceId: z.coerce.number().int().min(1).optional(),
  deviceCategoryId: z.coerce.number().int().min(1).optional(),
  friendlyName: z.string().max(255).optional(),
  lastSeen: z.coerce.date().optional(),
  definition: z.record(z.unknown()).optional(),
  capabilities: z.array(z.string().min(1).max(128)).optional(),
});
export type UpsertZigbeeDeviceInput = z.infer<typeof upsertZigbeeDeviceSchema>;

export const createZigbeeStateSchema = z.object({
  deviceIeeeAddr: z.string().min(3).max(64),
  timestamp: z.coerce.date().optional(),
  payload: z.record(z.unknown()),

  state: z.string().max(32).optional(),
  brightness: z.coerce.number().int().min(0).max(255).optional(),
  linkquality: z.coerce.number().int().min(0).max(255).optional(),
  colorMode: z.string().max(32).optional(),
  occupancy: z.coerce.boolean().optional(),
  temperature: z.coerce.number().optional(),
  humidity: z.coerce.number().optional(),
  battery: z.coerce.number().optional(),
});
export type CreateZigbeeStateInput = z.infer<typeof createZigbeeStateSchema>;

export const createZigbeeLinksBatchSchema = z.object({
  collectedAt: z.coerce.date().optional(),
  links: z
    .array(
      z.object({
        sourceDeviceId: z.string().min(1),
        targetDeviceId: z.string().min(1),
        protocol: protocolSchema.default(Protocol.Zigbee),
        linkQuality: z.coerce.number().int().optional(),
        rssi: z.coerce.number().int().optional(),
        lqi: z.coerce.number().int().optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .min(1),
});
export type CreateZigbeeLinksBatchInput = z.infer<
  typeof createZigbeeLinksBatchSchema
>;

const listZigbeeDevicesQuerySchemaBase = z.object({
  q: z.string().max(255).optional(),
  type: zigbeeDeviceTypeSchema.optional(),
  houseId: z.string().min(1).max(255).optional(),
});
export const listZigbeeDevicesQuerySchema =
  listZigbeeDevicesQuerySchemaBase.merge(paginationQuerySchema);
export type ListZigbeeDevicesQuery = z.infer<
  typeof listZigbeeDevicesQuerySchema
>;

const listZigbeeStatesQuerySchemaBase = z.object({
  deviceIeeeAddr: z.string().min(3).max(64),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export const listZigbeeStatesQuerySchema =
  listZigbeeStatesQuerySchemaBase.merge(
    paginationQuerySchema.extend({
      limit: z
        .preprocess(
          (v) => (v === '' || v === null || v === undefined ? undefined : v),
          z.coerce.number().int().min(1).max(100).optional(),
        )
        .default(50),
    }),
  );
export type ListZigbeeStatesQuery = z.infer<typeof listZigbeeStatesQuerySchema>;

const listZigbeeLinksQuerySchemaBase = z.object({
  sourceDeviceId: z.string().min(1).optional(),
  protocol: protocolSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
const zigbeeLinksPaginationSchema = paginationQuerySchema.extend({
  limit: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : v),
      z.coerce.number().int().min(1).max(200).optional(),
    )
    .default(200),
});
export const listZigbeeLinksQuerySchema = listZigbeeLinksQuerySchemaBase.merge(
  zigbeeLinksPaginationSchema,
);
export type ListZigbeeLinksQuery = z.infer<typeof listZigbeeLinksQuerySchema>;

export const zigbeeDeviceLogKindSchema = z.enum([
  'state_ingest',
  'bridge_event',
]);
export const zigbeeDeviceLogSourceSchema = z.enum(['mqtt', 'api']);

const listZigbeeDeviceLogsQuerySchemaBase = z.object({
  deviceIeeeAddr: z.string().min(3).max(64).optional(),
  physicalDeviceId: z.string().min(24).max(24).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  kind: zigbeeDeviceLogKindSchema.optional(),
  source: zigbeeDeviceLogSourceSchema.optional(),
});
export const listZigbeeDeviceLogsQuerySchema =
  listZigbeeDeviceLogsQuerySchemaBase.merge(
    paginationQuerySchema.extend({
      limit: z
        .preprocess(
          (v) => (v === '' || v === null || v === undefined ? undefined : v),
          z.coerce.number().int().min(1).max(100).optional(),
        )
        .default(50),
    }),
  );
export type ListZigbeeDeviceLogsQuery = z.infer<
  typeof listZigbeeDeviceLogsQuerySchema
>;

export const zigbeeSocketSubscribeSchema = z
  .object({
    deviceIeeeAddrs: z.array(z.string().min(3).max(64)).max(200).optional(),
    physicalDeviceIds: z.array(z.string().min(24).max(24)).max(200).optional(),
  })
  .refine(
    (v) =>
      (v.deviceIeeeAddrs?.length ?? 0) > 0 ||
      (v.physicalDeviceIds?.length ?? 0) > 0,
    { message: 'Укажите deviceIeeeAddrs и/или physicalDeviceIds' },
  );
export type ZigbeeSocketSubscribePayload = z.infer<
  typeof zigbeeSocketSubscribeSchema
>;

export const zigbeeCommandSchema = z.object({
  payload: z.record(z.unknown()).refine((v) => Object.keys(v).length > 0, {
    message: 'payload не может быть пустым',
  }),
});
export type ZigbeeCommandInput = z.infer<typeof zigbeeCommandSchema>;

export const zigbeeSocketCommandSchema = z
  .object({
    deviceIeeeAddr: z.string().min(3).max(64).optional(),
    physicalDeviceId: z.string().min(24).max(24).optional(),
    payload: z.record(z.unknown()),
  })
  .refine((v) => v.deviceIeeeAddr || v.physicalDeviceId, {
    message: 'Укажите deviceIeeeAddr или physicalDeviceId',
  })
  .refine((v) => Object.keys(v.payload).length > 0, {
    message: 'payload не может быть пустым',
  });
export type ZigbeeSocketCommandPayload = z.infer<
  typeof zigbeeSocketCommandSchema
>;
