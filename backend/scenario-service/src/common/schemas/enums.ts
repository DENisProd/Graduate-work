import { z } from 'zod';

export const scenarioStatusSchema = z.enum(['OFFLINE', 'ONLINE', 'ERROR']);
export type ScenarioStatus = z.infer<typeof scenarioStatusSchema>;

export const triggerSourceTypeSchema = z.enum([
  'SCHEDULE',
  'MANUAL',
  'AUTOMATIC',
  'SYSTEM',
  'API',
]);
export type TriggerSourceType = z.infer<typeof triggerSourceTypeSchema>;

export const scenarioExecutionStatusSchema = z.enum([
  'RUNNING',
  'SUCCESS',
  'FAILURE',
]);
export type ScenarioExecutionStatus = z.infer<
  typeof scenarioExecutionStatusSchema
>;

export const deviceDataTypeSchema = z.enum([
  'FLOAT',
  'NUMBER',
  'STRING',
  'BOOLEAN',
]);
export type DeviceDataType = z.infer<typeof deviceDataTypeSchema>;
