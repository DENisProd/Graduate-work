import { z } from 'zod';

export enum ScenarioStatus {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  ERROR = 'ERROR',
}
export const scenarioStatusSchema = z.nativeEnum(ScenarioStatus);

export enum TriggerSourceType {
  SCHEDULE = 'SCHEDULE',
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  SYSTEM = 'SYSTEM',
  API = 'API',
}
export const triggerSourceTypeSchema = z.nativeEnum(TriggerSourceType);

export enum ScenarioExecutionStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}
export const scenarioExecutionStatusSchema = z.nativeEnum(
  ScenarioExecutionStatus,
);

export enum DeviceDataType {
  FLOAT = 'FLOAT',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
}
export const deviceDataTypeSchema = z.nativeEnum(DeviceDataType);
