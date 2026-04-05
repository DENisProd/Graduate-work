import { z } from 'zod';
export declare enum ScenarioStatus {
    OFFLINE = "OFFLINE",
    ONLINE = "ONLINE",
    ERROR = "ERROR"
}
export declare const scenarioStatusSchema: z.ZodNativeEnum<typeof ScenarioStatus>;
export declare enum TriggerSourceType {
    SCHEDULE = "SCHEDULE",
    MANUAL = "MANUAL",
    AUTOMATIC = "AUTOMATIC",
    SYSTEM = "SYSTEM",
    API = "API"
}
export declare const triggerSourceTypeSchema: z.ZodNativeEnum<typeof TriggerSourceType>;
export declare enum ScenarioExecutionStatus {
    RUNNING = "RUNNING",
    SUCCESS = "SUCCESS",
    FAILURE = "FAILURE"
}
export declare const scenarioExecutionStatusSchema: z.ZodNativeEnum<typeof ScenarioExecutionStatus>;
export declare enum DeviceDataType {
    FLOAT = "FLOAT",
    NUMBER = "NUMBER",
    STRING = "STRING",
    BOOLEAN = "BOOLEAN"
}
export declare const deviceDataTypeSchema: z.ZodNativeEnum<typeof DeviceDataType>;
