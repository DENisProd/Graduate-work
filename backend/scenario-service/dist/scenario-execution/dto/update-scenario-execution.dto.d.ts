declare const UpdateScenarioExecutionDto_base: import("nestjs-zod").ZodDto<{
    status?: import("../../common/schemas").ScenarioExecutionStatus | undefined;
    errorMessage?: string | null | undefined;
    endedAt?: Date | null | undefined;
}, import("zod").ZodObjectDef<{
    status: import("zod").ZodOptional<import("zod").ZodNativeEnum<typeof import("../../common/schemas").ScenarioExecutionStatus>>;
    errorMessage: import("zod").ZodNullable<import("zod").ZodOptional<import("zod").ZodString>>;
    endedAt: import("zod").ZodNullable<import("zod").ZodOptional<import("zod").ZodDate>>;
}, "strip", import("zod").ZodTypeAny>, {
    status?: import("../../common/schemas").ScenarioExecutionStatus | undefined;
    errorMessage?: string | null | undefined;
    endedAt?: Date | null | undefined;
}>;
export declare class UpdateScenarioExecutionDto extends UpdateScenarioExecutionDto_base {
}
export {};
