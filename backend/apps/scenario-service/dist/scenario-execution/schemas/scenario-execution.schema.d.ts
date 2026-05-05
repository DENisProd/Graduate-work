import { z } from 'zod';
import { ScenarioExecutionStatus } from '../../common/schemas/enums';
export declare const createScenarioExecutionSchema: z.ZodObject<{
    scenarioId: z.ZodString;
    status: z.ZodDefault<z.ZodNativeEnum<typeof ScenarioExecutionStatus>>;
    triggeredBy: z.ZodNativeEnum<typeof import("../../common/schemas/enums").TriggerSourceType>;
    triggerData: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    errorMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: ScenarioExecutionStatus;
    scenarioId: string;
    triggeredBy: import("../../common/schemas/enums").TriggerSourceType;
    triggerData: Record<string, unknown>;
    errorMessage?: string | undefined;
}, {
    scenarioId: string;
    triggeredBy: import("../../common/schemas/enums").TriggerSourceType;
    triggerData: Record<string, unknown>;
    status?: ScenarioExecutionStatus | undefined;
    errorMessage?: string | undefined;
}>;
export type CreateScenarioExecutionInput = z.infer<typeof createScenarioExecutionSchema>;
export declare const updateScenarioExecutionSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodNativeEnum<typeof ScenarioExecutionStatus>>;
    errorMessage: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    endedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
}, "strip", z.ZodTypeAny, {
    status?: ScenarioExecutionStatus | undefined;
    errorMessage?: string | null | undefined;
    endedAt?: Date | null | undefined;
}, {
    status?: ScenarioExecutionStatus | undefined;
    errorMessage?: string | null | undefined;
    endedAt?: Date | null | undefined;
}>;
export type UpdateScenarioExecutionInput = z.infer<typeof updateScenarioExecutionSchema>;
export declare const listScenarioExecutionsQuerySchema: z.ZodObject<{
    scenarioId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof ScenarioExecutionStatus>>;
    triggeredBy: z.ZodOptional<z.ZodNativeEnum<typeof import("../../common/schemas/enums").TriggerSourceType>>;
} & {
    page: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: ScenarioExecutionStatus | undefined;
    scenarioId?: string | undefined;
    triggeredBy?: import("../../common/schemas/enums").TriggerSourceType | undefined;
}, {
    status?: ScenarioExecutionStatus | undefined;
    page?: unknown;
    limit?: unknown;
    scenarioId?: string | undefined;
    triggeredBy?: import("../../common/schemas/enums").TriggerSourceType | undefined;
}>;
export type ListScenarioExecutionsQuery = z.infer<typeof listScenarioExecutionsQuerySchema>;
