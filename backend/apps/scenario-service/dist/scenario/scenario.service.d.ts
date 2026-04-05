import { ScenarioRepository } from './scenario.repository';
import type { CreateScenarioInput, UpdateScenarioInput, ListScenariosQuery } from './schemas/scenario.schema';
export declare class ScenarioService {
    private readonly repository;
    constructor(repository: ScenarioRepository);
    create(data: CreateScenarioInput): Promise<import("../mongo/schemas/scenario.mongo").ScenarioModel & {
        id: string;
    }>;
    findMany(query: ListScenariosQuery): Promise<{
        items: (import("../mongo/schemas/scenario.mongo").ScenarioModel & {
            id: string;
        })[];
        total: number;
    }>;
    findById(id: string): Promise<import("../mongo/schemas/scenario.mongo").ScenarioModel & {
        id: string;
    }>;
    update(id: string, data: UpdateScenarioInput): Promise<import("../mongo/schemas/scenario.mongo").ScenarioModel & {
        id: string;
    }>;
    remove(id: string): Promise<import("../mongo/schemas/scenario.mongo").ScenarioModel & {
        id: string;
    }>;
}
