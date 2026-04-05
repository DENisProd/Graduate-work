declare const CreateScenarioExecutionDto_base: import("nestjs-zod").ZodDto<{
    status: import("../../common/schemas").ScenarioExecutionStatus;
    scenarioId: string;
    triggeredBy: import("../../common/schemas").TriggerSourceType;
    triggerData: Record<string, unknown>;
    errorMessage?: string | undefined;
}, import("zod").ZodObjectDef<{
    scenarioId: import("zod").ZodString;
    status: import("zod").ZodDefault<import("zod").ZodNativeEnum<typeof import("../../common/schemas").ScenarioExecutionStatus>>;
    triggeredBy: import("zod").ZodNativeEnum<typeof import("../../common/schemas").TriggerSourceType>;
    triggerData: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>;
    errorMessage: import("zod").ZodOptional<import("zod").ZodString>;
}, "strip", import("zod").ZodTypeAny>, {
    scenarioId: string;
    triggeredBy: import("../../common/schemas").TriggerSourceType;
    triggerData: Record<string, unknown>;
    status?: import("../../common/schemas").ScenarioExecutionStatus | undefined;
    errorMessage?: string | undefined;
}>;
export declare class CreateScenarioExecutionDto extends CreateScenarioExecutionDto_base {
}
export {};
