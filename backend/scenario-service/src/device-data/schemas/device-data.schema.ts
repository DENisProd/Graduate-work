import { z } from 'zod';
import { deviceDataTypeSchema } from '../../common/schemas/enums';
import { paginationQuerySchema } from '../../common/schemas/pagination';

export const createDeviceDataSchema = z.object({
  deviceId: z.string().min(1),
  capability: z.string().min(1).max(128),
  attribute: z.string().min(1).max(128).optional(),
  type: deviceDataTypeSchema,
  value: z.unknown(),
  unit: z.string().max(50).optional(),
  quality: z.coerce.number().optional(),
  timestamp: z.coerce.date().optional(),
});
export type CreateDeviceDataInput = z.infer<typeof createDeviceDataSchema>;

const listDeviceDataQuerySchemaBase = z.object({
  deviceId: z.string().optional(),
  capability: z.string().optional(),
  attribute: z.string().optional(),
  type: deviceDataTypeSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export const listDeviceDataQuerySchema =
  listDeviceDataQuerySchemaBase.merge(paginationQuerySchema);
export type ListDeviceDataQuery = z.infer<
  typeof listDeviceDataQuerySchema
>;
