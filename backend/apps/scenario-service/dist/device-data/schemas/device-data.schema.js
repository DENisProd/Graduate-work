"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceDataSeriesQuerySchema = exports.listDeviceDataQuerySchema = exports.deviceDataSeriesRangeSchema = exports.createDeviceDataSchema = void 0;
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
exports.deviceDataSeriesRangeSchema = zod_1.z.enum(['1m', '1h', '6h', '24h', '7d']);
const listDeviceDataQuerySchemaBase = zod_1.z.object({
    deviceId: zod_1.z.string().optional(),
    capability: zod_1.z.string().optional(),
    attribute: zod_1.z.string().optional(),
    type: enums_1.deviceDataTypeSchema.optional(),
    from: zod_1.z
        .preprocess((v) => {
        if (typeof v !== 'string')
            return v;
        try {
            const once = decodeURIComponent(v);
            return once.includes('%') ? decodeURIComponent(once) : once;
        }
        catch {
            return v;
        }
    }, zod_1.z.coerce.date())
        .optional(),
    to: zod_1.z
        .preprocess((v) => {
        if (typeof v !== 'string')
            return v;
        try {
            const once = decodeURIComponent(v);
            return once.includes('%') ? decodeURIComponent(once) : once;
        }
        catch {
            return v;
        }
    }, zod_1.z.coerce.date())
        .optional(),
});
exports.listDeviceDataQuerySchema = listDeviceDataQuerySchemaBase.merge(pagination_1.paginationQuerySchema);
exports.deviceDataSeriesQuerySchema = zod_1.z.object({
    deviceId: zod_1.z.string().min(1),
    range: exports.deviceDataSeriesRangeSchema,
    capabilities: zod_1.z.string().optional(),
    to: zod_1.z
        .preprocess((v) => {
        if (typeof v !== 'string')
            return v;
        try {
            const once = decodeURIComponent(v);
            return once.includes('%') ? decodeURIComponent(once) : once;
        }
        catch {
            return v;
        }
    }, zod_1.z.coerce.date())
        .optional(),
});
//# sourceMappingURL=device-data.schema.js.map