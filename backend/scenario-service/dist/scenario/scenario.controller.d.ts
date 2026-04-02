import { ScenarioService } from './scenario.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { UpdateScenarioDto } from './dto/update-scenario.dto';
export declare class ScenarioController {
    private readonly service;
    constructor(service: ScenarioService);
    create(dto: CreateScenarioDto): Promise<import("../mongo/schemas/scenario.mongo").ScenarioModel & {
        id: string;
    }>;
    findMany(query: unknown): Promise<{
        items: (import("../mongo/schemas/scenario.mongo").ScenarioModel & {
            id: string;
        })[];
        total: number;
    }>;
    findOne(params: unknown): Promise<import("../mongo/schemas/scenario.mongo").ScenarioModel & {
        id: string;
    }>;
    update(params: unknown, dto: UpdateScenarioDto): Promise<import("../mongo/schemas/scenario.mongo").ScenarioModel & {
        id: string;
    }>;
    remove(params: unknown): Promise<import("../mongo/schemas/scenario.mongo").ScenarioModel & {
        id: string;
    }>;
}
