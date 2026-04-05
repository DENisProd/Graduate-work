"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDeviceDataQuerySchema = exports.createDeviceDataSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../common/schemas/enums");
const pagination_1 = require("../../common/schemas/pagination");
exports.createDeviceDataSchema = zod_1.z.object({
    deviceId: zod_1.z.string().min(1),
    capability: zod_1.z.string().min(1).max(128),
    attribute: zod_1.z.string().min(1).max(128).optional(),
    type: enums_1.deviceDataTypeSchema,
    value: zod_1.z.unknown(),
    unit: zod_1.z.string().max(50).optional(),
    quality: zod_1.z.coerce.number().optional(),
    timestamp: zod_1.z.coerce.date().optional(),
});
const listDeviceDataQuerySchemaBase = zod_1.z.object({
    deviceId: zod_1.z.string().optional(),
    capability: zod_1.z.string().optional(),
    attribute: zod_1.z.string().optional(),
    type: enums_1.deviceDataTypeSchema.optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
});
exports.listDeviceDataQuerySchema = listDeviceDataQuerySchemaBase.merge(pagination_1.paginationQuerySchema);
//# sourceMappingURL=device-data.schema.js.map