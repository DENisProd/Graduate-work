import { ScenarioStatus } from '../../common/schemas/enums';
import type { ScenarioDefinition } from '../schemas/scenario-definition.schema';
export declare class ScenarioResponseDto {
    id: string;
    name: string;
    description?: string | null;
    houseId: string;
    definition: ScenarioDefinition;
    createdAt: Date;
    updatedAt: Date;
    status: ScenarioStatus;
    creatorId: string;
}
export declare class ScenarioListResponseDto {
    items: ScenarioResponseDto[];
    total: number;
}
