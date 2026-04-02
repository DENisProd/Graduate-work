import { ScenarioExecutionRepository } from './scenario-execution.repository';
import type { CreateScenarioExecutionInput, UpdateScenarioExecutionInput, ListScenarioExecutionsQuery } from './schemas/scenario-execution.schema';
export declare class ScenarioExecutionService {
    private readonly repository;
    constructor(repository: ScenarioExecutionRepository);
    create(data: CreateScenarioExecutionInput): Promise<import("../mongo/schemas/scenario-execution.mongo").ScenarioExecutionModel & {
        id: string;
    }>;
    findMany(query: ListScenarioExecutionsQuery): Promise<{
        items: (import("../mongo/schemas/scenario-execution.mongo").ScenarioExecutionModel & {
            id: string;
        })[];
        total: number;
    }>;
    findById(id: string): Promise<import("../mongo/schemas/scenario-execution.mongo").ScenarioExecutionModel & {
        id: string;
    }>;
    update(id: string, data: UpdateScenarioExecutionInput): Promise<import("../mongo/schemas/scenario-execution.mongo").ScenarioExecutionModel & {
        id: string;
    }>;
    remove(id: string): Promise<import("../mongo/schemas/scenario-execution.mongo").ScenarioExecutionModel & {
        id: string;
    }>;
}
