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
export declare const ScenarioExecutionSchema: import("mongoose").Schema<ScenarioExecutionModel, import("mongoose").Model<ScenarioExecutionModel, any, any, any, (import("mongoose").Document<unknown, any, ScenarioExecutionModel, any, import("mongoose").DefaultSchemaOptions> & ScenarioExecutionModel & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, ScenarioExecutionModel, any, import("mongoose").DefaultSchemaOptions> & ScenarioExecutionModel & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, ScenarioExecutionModel>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ScenarioExecutionModel, import("mongoose").Document<unknown, {}, ScenarioExecutionModel, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioExecutionModel & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    scenarioId?: import("mongoose").SchemaDefinitionProperty<string, ScenarioExecutionModel, import("mongoose").Document<unknown, {}, ScenarioExecutionModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioExecutionModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<ScenarioExecutionStatus, ScenarioExecutionModel, import("mongoose").Document<unknown, {}, ScenarioExecutionModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioExecutionModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    triggeredBy?: import("mongoose").SchemaDefinitionProperty<TriggerSourceType, ScenarioExecutionModel, import("mongoose").Document<unknown, {}, ScenarioExecutionModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioExecutionModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    triggerData?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, ScenarioExecutionModel, import("mongoose").Document<unknown, {}, ScenarioExecutionModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioExecutionModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    errorMessage?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, ScenarioExecutionModel, import("mongoose").Document<unknown, {}, ScenarioExecutionModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioExecutionModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startedAt?: import("mongoose").SchemaDefinitionProperty<Date, ScenarioExecutionModel, import("mongoose").Document<unknown, {}, ScenarioExecutionModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioExecutionModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endedAt?: import("mongoose").SchemaDefinitionProperty<Date | null | undefined, ScenarioExecutionModel, import("mongoose").Document<unknown, {}, ScenarioExecutionModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioExecutionModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ScenarioExecutionModel>;
