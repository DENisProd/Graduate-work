import { ScenarioExecutionStatus, TriggerSourceType } from '../../common/schemas/enums';
export declare class ScenarioExecutionResponseDto {
    id: string;
    scenarioId: string;
    status: ScenarioExecutionStatus;
    triggeredBy: TriggerSourceType;
    triggerData: Record<string, unknown>;
    errorMessage?: string | null;
    startedAt: Date;
    endedAt?: Date | null;
}
export declare class ScenarioExecutionListResponseDto {
    items: ScenarioExecutionResponseDto[];
    total: number;
}
