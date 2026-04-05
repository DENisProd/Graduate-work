import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { DeviceDataType } from '../../common/schemas/enums';
export declare const DEVICE_DATA_MODEL = "DeviceData";
export declare class DeviceDataModel {
    deviceId: Types.ObjectId;
    capability: string;
    attribute?: string | null;
    type: DeviceDataType;
    value: unknown;
    unit?: string | null;
    quality?: number | null;
    timestamp: Date;
}
export type DeviceDataDocument = HydratedDocument<DeviceDataModel>;
export declare const DeviceDataSchema: import("mongoose").Schema<DeviceDataModel, import("mongoose").Model<DeviceDataModel, any, any, any, (import("mongoose").Document<unknown, any, DeviceDataModel, any, import("mongoose").DefaultSchemaOptions> & DeviceDataModel & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, DeviceDataModel, any, import("mongoose").DefaultSchemaOptions> & DeviceDataModel & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, DeviceDataModel>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DeviceDataModel, import("mongoose").Document<unknown, {}, DeviceDataModel, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<DeviceDataModel & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    deviceId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, DeviceDataModel, import("mongoose").Document<unknown, {}, DeviceDataModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceDataModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    capability?: import("mongoose").SchemaDefinitionProperty<string, DeviceDataModel, import("mongoose").Document<unknown, {}, DeviceDataModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceDataModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    attribute?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, DeviceDataModel, import("mongoose").Document<unknown, {}, DeviceDataModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceDataModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<DeviceDataType, DeviceDataModel, import("mongoose").Document<unknown, {}, DeviceDataModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceDataModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    value?: import("mongoose").SchemaDefinitionProperty<unknown, DeviceDataModel, import("mongoose").Document<unknown, {}, DeviceDataModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceDataModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    unit?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, DeviceDataModel, import("mongoose").Document<unknown, {}, DeviceDataModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceDataModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    quality?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, DeviceDataModel, import("mongoose").Document<unknown, {}, DeviceDataModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceDataModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    timestamp?: import("mongoose").SchemaDefinitionProperty<Date, DeviceDataModel, import("mongoose").Document<unknown, {}, DeviceDataModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceDataModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, DeviceDataModel>;
