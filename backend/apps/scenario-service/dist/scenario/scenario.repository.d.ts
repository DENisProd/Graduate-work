import type { Model } from 'mongoose';
import type { CreateScenarioInput, UpdateScenarioInput } from './schemas/scenario.schema';
import { ScenarioModel } from '../mongo/schemas/scenario.mongo';
type Scenario = ScenarioModel & {
    id: string;
};
export declare class ScenarioRepository {
    private readonly model;
    constructor(model: Model<ScenarioModel>);
    private map;
    create(data: CreateScenarioInput): Promise<Scenario>;
    findById(id: string): Promise<Scenario | null>;
    findMany(params: {
        houseId?: string;
        status?: ScenarioModel['status'];
        creatorId?: string;
        page: number;
        limit: number;
    }): Promise<{
        items: Scenario[];
        total: number;
    }>;
    update(id: string, data: UpdateScenarioInput): Promise<Scenario>;
    delete(id: string): Promise<Scenario>;
}
export {};
