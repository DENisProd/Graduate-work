import { z } from 'zod';

export const createPhysicalDeviceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  deviceTypeId: z.coerce.number().int().min(1),
  houseId: z.string().min(1).max(255),
  deviceId: z.string().max(255).optional(),
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

export const listPhysicalDevicesQuerySchema = z.object({
  houseId: z.string().min(1).max(255).optional(),
  roomId: z.string().optional(),
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListPhysicalDevicesQuery = z.infer<
  typeof listPhysicalDevicesQuerySchema
>;
