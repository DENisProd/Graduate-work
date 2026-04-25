import { z } from 'zod';
import { paginationQuerySchema } from '../../common/schemas/pagination';

export const createPhysicalDeviceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  deviceTypeId: z.coerce.number().int().min(1).optional(),
  houseId: z.string().min(1).max(255),
  deviceId: z.coerce.number().int().min(1).optional(),
  deviceCategoryId: z.coerce.number().int().min(1).optional(),
  roomId: z.string().max(255).optional(),
  firmwareVersion: z.string().max(100).optional(),
  ipAddress: z.string().ip().optional().or(z.literal('')),
  macAddress: z.string().max(17).optional(),
  serialNumber: z.string().max(100).optional(),
});
export type CreatePhysicalDeviceInput = z.infer<
  typeof createPhysicalDeviceSchema
>;

export const updatePhysicalDeviceSchema = createPhysicalDeviceSchema.partial();
export type UpdatePhysicalDeviceInput = z.infer<
  typeof updatePhysicalDeviceSchema
>;

const listPhysicalDevicesQuerySchemaBase = z.object({
  houseId: z.string().min(1).max(255).optional(),
  roomId: z.string().optional(),
});
export const listPhysicalDevicesQuerySchema =
  listPhysicalDevicesQuerySchemaBase.merge(paginationQuerySchema);
export type ListPhysicalDevicesQuery = z.infer<
  typeof listPhysicalDevicesQuerySchema
>;
