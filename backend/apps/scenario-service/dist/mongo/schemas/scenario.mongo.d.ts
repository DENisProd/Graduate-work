import type { HydratedDocument } from 'mongoose';
import { ScenarioStatus } from '../../common/schemas/enums';
export declare const SCENARIO_MODEL = "Scenario";
export declare class ScenarioModel {
    name: string;
    description?: string | null;
    houseId: string;
    definition: Record<string, unknown>;
    status: ScenarioStatus;
    creatorId: string;
    createdAt: Date;
    updatedAt: Date;
}
export type ScenarioDocument = HydratedDocument<ScenarioModel>;
export declare const ScenarioSchema: any;
