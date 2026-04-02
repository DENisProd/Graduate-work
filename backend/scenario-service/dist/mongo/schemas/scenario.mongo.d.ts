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
export declare const ScenarioSchema: import("mongoose").Schema<ScenarioModel, import("mongoose").Model<ScenarioModel, any, any, any, (import("mongoose").Document<unknown, any, ScenarioModel, any, import("mongoose").DefaultSchemaOptions> & ScenarioModel & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, ScenarioModel, any, import("mongoose").DefaultSchemaOptions> & ScenarioModel & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, ScenarioModel>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ScenarioModel, import("mongoose").Document<unknown, {}, ScenarioModel, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioModel & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, ScenarioModel, import("mongoose").Document<unknown, {}, ScenarioModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, ScenarioModel, import("mongoose").Document<unknown, {}, ScenarioModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    houseId?: import("mongoose").SchemaDefinitionProperty<string, ScenarioModel, import("mongoose").Document<unknown, {}, ScenarioModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    definition?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, ScenarioModel, import("mongoose").Document<unknown, {}, ScenarioModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<ScenarioStatus, ScenarioModel, import("mongoose").Document<unknown, {}, ScenarioModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    creatorId?: import("mongoose").SchemaDefinitionProperty<string, ScenarioModel, import("mongoose").Document<unknown, {}, ScenarioModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, ScenarioModel, import("mongoose").Document<unknown, {}, ScenarioModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date, ScenarioModel, import("mongoose").Document<unknown, {}, ScenarioModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScenarioModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ScenarioModel>;
