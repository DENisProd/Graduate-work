import { ScenarioExecutionService } from './scenario-execution.service';
import { CreateScenarioExecutionDto } from './dto/create-scenario-execution.dto';
import { UpdateScenarioExecutionDto } from './dto/update-scenario-execution.dto';
export declare class ScenarioExecutionController {
    private readonly service;
    constructor(service: ScenarioExecutionService);
    create(dto: CreateScenarioExecutionDto): Promise<import("../mongo/schemas/scenario-execution.mongo").ScenarioExecutionModel & {
        id: string;
    }>;
    findMany(query: unknown): Promise<{
        items: (import("../mongo/schemas/scenario-execution.mongo").ScenarioExecutionModel & {
            id: string;
        })[];
        total: number;
    }>;
    findOne(params: unknown): Promise<import("../mongo/schemas/scenario-execution.mongo").ScenarioExecutionModel & {
        id: string;
    }>;
    update(params: unknown, dto: UpdateScenarioExecutionDto): Promise<import("../mongo/schemas/scenario-execution.mongo").ScenarioExecutionModel & {
        id: string;
    }>;
    remove(params: unknown): Promise<import("../mongo/schemas/scenario-execution.mongo").ScenarioExecutionModel & {
        id: string;
    }>;
}
