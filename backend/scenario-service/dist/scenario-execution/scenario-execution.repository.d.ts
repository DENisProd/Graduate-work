import type { Model } from 'mongoose';
import type { CreateScenarioExecutionInput, UpdateScenarioExecutionInput } from './schemas/scenario-execution.schema';
import { ScenarioExecutionModel } from '../mongo/schemas/scenario-execution.mongo';
type ScenarioExecution = ScenarioExecutionModel & {
    id: string;
};
export declare class ScenarioExecutionRepository {
    private readonly model;
    constructor(model: Model<ScenarioExecutionModel>);
    private map;
    create(input: CreateScenarioExecutionInput): Promise<ScenarioExecution>;
    findById(id: string): Promise<ScenarioExecution | null>;
    findMany(params: {
        scenarioId?: string;
        status?: ScenarioExecutionModel['status'];
        triggeredBy?: ScenarioExecutionModel['triggeredBy'];
        page: number;
        limit: number;
    }): Promise<{
        items: ScenarioExecution[];
        total: number;
    }>;
    update(id: string, data: UpdateScenarioExecutionInput): Promise<ScenarioExecution>;
    delete(id: string): Promise<ScenarioExecution>;
}
export {};
