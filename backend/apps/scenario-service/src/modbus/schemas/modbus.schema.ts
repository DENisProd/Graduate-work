import { z } from 'zod';

export const registerTypeSchema = z.enum([
  'holding',
  'input',
  'coil',
  'discrete',
]);

export const createModbusDeviceSchema = z.object({
  name: z.string().min(1),
  slaveId: z.coerce.number().int().min(1),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
});
export type CreateModbusDeviceInput = z.infer<typeof createModbusDeviceSchema>;

export const createModbusRegisterSchema = z.object({
  name: z.string().min(1),
  registerType: registerTypeSchema,
  address: z.coerce.number().int().min(0),
  count: z.coerce.number().int().min(1).optional(),
  unit: z.string().optional(),
  scaleFactor: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
  writable: z.boolean().optional(),
});
export type CreateModbusRegisterInput = z.infer<
  typeof createModbusRegisterSchema
>;

export const writeModbusRegisterSchema = z.object({
  value: z.coerce.number().optional(),
  values: z.array(z.coerce.number()).optional(),
  coil: z.boolean().optional(),
});
export type WriteModbusRegisterInput = z.infer<typeof writeModbusRegisterSchema>;
