import { z } from 'zod';
import { deviceDataTypeSchema } from '../../common/schemas/enums';

export const createDeviceDataSchema = z.object({
  deviceId: z.string().optional(),
  deviceTypeId: z.coerce.number().int().min(1).optional(),
  deviceFunction: z.string().min(1).max(255),
  type: deviceDataTypeSchema,
  unit: z.string().max(50).optional(),
  timestamp: z.coerce.date(),
  data: z.record(z.unknown()),
});
export type CreateDeviceDataInput = z.infer<typeof createDeviceDataSchema>;

export const listDeviceDataQuerySchema = z.object({
  deviceId: z.string().optional(),
  deviceTypeId: z.coerce.number().int().min(1).optional(),
  deviceFunction: z.string().optional(),
  type: deviceDataTypeSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListDeviceDataQuery = z.infer<typeof listDeviceDataQuerySchema>;
