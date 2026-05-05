import type { HydratedDocument } from 'mongoose';
export declare const ZIGBEE_DEVICE_LOG_MODEL = "ZigbeeDeviceLog";
export declare enum ZigbeeDeviceLogSource {
    Mqtt = "mqtt",
    Api = "api"
}
export declare enum ZigbeeDeviceLogKind {
    StateIngest = "state_ingest",
    BridgeEvent = "bridge_event"
}
export declare class ZigbeeDeviceLogModel {
    deviceIeeeAddr: string;
    physicalDeviceId?: string | null;
    timestamp: Date;
    source: ZigbeeDeviceLogSource;
    kind: ZigbeeDeviceLogKind;
    message?: string | null;
    metrics?: {
        state?: string | null;
        brightness?: number | null;
        linkquality?: number | null;
        colorMode?: string | null;
        occupancy?: boolean | null;
        temperature?: number | null;
        humidity?: number | null;
        battery?: number | null;
    } | null;
    payloadKeys?: string[];
    stateDocumentId?: string | null;
    metadata?: Record<string, unknown> | null;
}
export type ZigbeeDeviceLogDocument = HydratedDocument<ZigbeeDeviceLogModel>;
export declare const ZigbeeDeviceLogSchema: import("mongoose").Schema<ZigbeeDeviceLogModel, import("mongoose").Model<ZigbeeDeviceLogModel, any, any, any, any, any, ZigbeeDeviceLogModel>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ZigbeeDeviceLogModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceLogModel, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceLogModel & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    deviceIeeeAddr?: import("mongoose").SchemaDefinitionProperty<string, ZigbeeDeviceLogModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceLogModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceLogModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    physicalDeviceId?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, ZigbeeDeviceLogModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceLogModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceLogModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    timestamp?: import("mongoose").SchemaDefinitionProperty<Date, ZigbeeDeviceLogModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceLogModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceLogModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    source?: import("mongoose").SchemaDefinitionProperty<ZigbeeDeviceLogSource, ZigbeeDeviceLogModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceLogModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceLogModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    kind?: import("mongoose").SchemaDefinitionProperty<ZigbeeDeviceLogKind, ZigbeeDeviceLogModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceLogModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceLogModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    message?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, ZigbeeDeviceLogModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceLogModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceLogModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metrics?: import("mongoose").SchemaDefinitionProperty<{
        state?: string | null;
        brightness?: number | null;
        linkquality?: number | null;
        colorMode?: string | null;
        occupancy?: boolean | null;
        temperature?: number | null;
        humidity?: number | null;
        battery?: number | null;
    } | null | undefined, ZigbeeDeviceLogModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceLogModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceLogModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    payloadKeys?: import("mongoose").SchemaDefinitionProperty<string[] | undefined, ZigbeeDeviceLogModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceLogModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceLogModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    stateDocumentId?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, ZigbeeDeviceLogModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceLogModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceLogModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown> | null | undefined, ZigbeeDeviceLogModel, import("mongoose").Document<unknown, {}, ZigbeeDeviceLogModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ZigbeeDeviceLogModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ZigbeeDeviceLogModel>;
