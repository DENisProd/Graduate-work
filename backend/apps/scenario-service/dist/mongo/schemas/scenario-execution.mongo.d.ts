import type { HydratedDocument } from 'mongoose';
import { ScenarioExecutionStatus, TriggerSourceType } from '../../common/schemas/enums';
export declare const SCENARIO_EXECUTION_MODEL = "ScenarioExecution";
export declare class ScenarioExecutionModel {
    scenarioId: string;
    status: ScenarioExecutionStatus;
    triggeredBy: TriggerSourceType;
    triggerData: Record<string, unknown>;
    errorMessage?: string | null;
    startedAt: Date;
    endedAt?: Date | null;
}
export type ScenarioExecutionDocument = HydratedDocument<ScenarioExecutionModel>;
export declare const ScenarioExecutionSchema: any;
