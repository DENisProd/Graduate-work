import type { HydratedDocument } from 'mongoose';
import { ZigbeeDeviceType } from '../../zigbee/schemas/zigbee.schemas';
export declare const PHYSICAL_DEVICE_MODEL = "PhysicalDevice";
export declare class PhysicalDeviceModel {
    name?: string | null;
    description?: string | null;
    houseId?: string | null;
    roomId?: string | null;
    deviceId?: string | null;
    protocolAddress?: string | null;
    networkAddress?: number | null;
    type?: ZigbeeDeviceType;
    deviceTypeId?: number | null;
    manufacturerName?: string | null;
    model?: string | null;
    friendlyName?: string | null;
    firmwareVersion?: string | null;
    lastSeen?: Date | null;
    definition?: Record<string, unknown> | null;
    capabilities?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export type PhysicalDeviceDocument = HydratedDocument<PhysicalDeviceModel>;
export declare const PhysicalDeviceSchema: import("mongoose").Schema<PhysicalDeviceModel, import("mongoose").Model<PhysicalDeviceModel, any, any, any, (import("mongoose").Document<unknown, any, PhysicalDeviceModel, any, import("mongoose").DefaultSchemaOptions> & PhysicalDeviceModel & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, PhysicalDeviceModel, any, import("mongoose").DefaultSchemaOptions> & PhysicalDeviceModel & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, PhysicalDeviceModel>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    houseId?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    roomId?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deviceId?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    protocolAddress?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    networkAddress?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<ZigbeeDeviceType | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deviceTypeId?: import("mongoose").SchemaDefinitionProperty<number | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    manufacturerName?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    model?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    friendlyName?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    firmwareVersion?: import("mongoose").SchemaDefinitionProperty<string | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastSeen?: import("mongoose").SchemaDefinitionProperty<Date | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    definition?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown> | null | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    capabilities?: import("mongoose").SchemaDefinitionProperty<string[] | undefined, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date, PhysicalDeviceModel, import("mongoose").Document<unknown, {}, PhysicalDeviceModel, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PhysicalDeviceModel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PhysicalDeviceModel>;
