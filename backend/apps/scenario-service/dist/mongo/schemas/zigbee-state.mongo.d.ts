import type { HydratedDocument } from 'mongoose';
export declare const ZIGBEE_STATE_MODEL = "ZigbeeDeviceState";
export declare class ZigbeeDeviceStateModel {
    deviceIeeeAddr: string;
    timestamp: Date;
    payload: Record<string, unknown>;
    state?: string | null;
    brightness?: number | null;
    linkquality?: number | null;
    colorMode?: string | null;
    occupancy?: boolean | null;
    temperature?: number | null;
    humidity?: number | null;
    battery?: number | null;
}
export type ZigbeeDeviceStateDocument = HydratedDocument<ZigbeeDeviceStateModel>;
export declare const ZigbeeStateSchema: import("mongoose").Schema<ZigbeeDeviceStateModel, import("mongoose").Model<ZigbeeDeviceStateModel, any, any, any, any, any, ZigbeeDeviceStateModel>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    deviceIeeeAddr?: import("mongoose").SchemaDefinitionProperty<string, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    timestamp?: import("mongoose").SchemaDefinitionProperty<Date, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    payload?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    state?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    brightness?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    linkquality?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    colorMode?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    occupancy?: import("mongoose").SchemaDefinitionProperty<boolean | null | undefined, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    temperature?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    humidity?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    battery?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, ZigbeeDeviceStateModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceStateModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceStateModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ZigbeeDeviceStateModel>;
