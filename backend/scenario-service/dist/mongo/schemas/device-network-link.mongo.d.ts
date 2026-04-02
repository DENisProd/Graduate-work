import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
export declare enum Protocol {
    Zigbee = "Zigbee",
    ZWave = "ZWave",
    Matter = "Matter",
    WiFi = "WiFi",
    Bluetooth = "Bluetooth",
    Unknown = "Unknown"
}
export declare const DEVICE_NETWORK_LINK_MODEL = "DeviceNetworkLink";
export declare class DeviceNetworkLinkModel {
    sourceDeviceId: Types.ObjectId;
    targetDeviceId: Types.ObjectId;
    protocol: Protocol;
    linkQuality?: number | null;
    rssi?: number | null;
    lqi?: number | null;
    metadata?: Record<string, unknown> | null;
    collectedAt: Date;
}
export type DeviceNetworkLinkDocument = HydratedDocument<DeviceNetworkLinkModel>;
export declare const DeviceNetworkLinkSchema: import("mongoose").Schema<DeviceNetworkLinkModel, import("mongoose").Model<DeviceNetworkLinkModel, any, any, any, (import("mongoose").Document<unknown, any, DeviceNetworkLinkModel, any, import("mongoose").DefaultSchemaOptions> & DeviceNetworkLinkModel & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, DeviceNetworkLinkModel, any, import("mongoose").DefaultSchemaOptions> & DeviceNetworkLinkModel & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, DeviceNetworkLinkModel>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DeviceNetworkLinkModel, import("mongoose").Document<unknown, {}, DeviceNetworkLinkModel, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<DeviceNetworkLinkModel & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    sourceDeviceId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, DeviceNetworkLinkModel, import("mongoose").Document<unknown, {}, DeviceNetworkLinkModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceNetworkLinkModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    targetDeviceId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, DeviceNetworkLinkModel, import("mongoose").Document<unknown, {}, DeviceNetworkLinkModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceNetworkLinkModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    protocol?: import("mongoose").SchemaDefinitionProperty<Protocol, DeviceNetworkLinkModel, import("mongoose").Document<unknown, {}, DeviceNetworkLinkModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceNetworkLinkModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    linkQuality?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, DeviceNetworkLinkModel, import("mongoose").Document<unknown, {}, DeviceNetworkLinkModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceNetworkLinkModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rssi?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, DeviceNetworkLinkModel, import("mongoose").Document<unknown, {}, DeviceNetworkLinkModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceNetworkLinkModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lqi?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, DeviceNetworkLinkModel, import("mongoose").Document<unknown, {}, DeviceNetworkLinkModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceNetworkLinkModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown> | null | undefined, DeviceNetworkLinkModel, import("mongoose").Document<unknown, {}, DeviceNetworkLinkModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceNetworkLinkModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    collectedAt?: import("mongoose").SchemaDefinitionProperty<Date, DeviceNetworkLinkModel, import("mongoose").Document<unknown, {}, DeviceNetworkLinkModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DeviceNetworkLinkModel & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, DeviceNetworkLinkModel>;
