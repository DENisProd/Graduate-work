"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listZigbeeLinksQuerySchema = exports.listZigbeeStatesQuerySchema = exports.listZigbeeDevicesQuerySchema = exports.createZigbeeLinksBatchSchema = exports.createZigbeeStateSchema = exports.upsertZigbeeDeviceSchema = exports.protocolSchema = exports.Protocol = exports.zigbeeDeviceTypeSchema = exports.ZigbeeDeviceType = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../common/schemas/pagination");
var ZigbeeDeviceType;
(function (ZigbeeDeviceType) {
    ZigbeeDeviceType["Coordinator"] = "Coordinator";
    ZigbeeDeviceType["Router"] = "Router";
    ZigbeeDeviceType["EndDevice"] = "EndDevice";
})(ZigbeeDeviceType || (exports.ZigbeeDeviceType = ZigbeeDeviceType = {}));
exports.zigbeeDeviceTypeSchema = zod_1.z.nativeEnum(ZigbeeDeviceType);
var Protocol;
(function (Protocol) {
    Protocol["Zigbee"] = "Zigbee";
    Protocol["ZWave"] = "ZWave";
    Protocol["Matter"] = "Matter";
    Protocol["WiFi"] = "WiFi";
    Protocol["Bluetooth"] = "Bluetooth";
    Protocol["Unknown"] = "Unknown";
})(Protocol || (exports.Protocol = Protocol = {}));
exports.protocolSchema = zod_1.z.nativeEnum(Protocol);
exports.upsertZigbeeDeviceSchema = zod_1.z.object({
    ieeeAddr: zod_1.z.string().min(3).max(64),
    networkAddress: zod_1.z.coerce.number().int().min(0).optional(),
    type: exports.zigbeeDeviceTypeSchema.optional(),
    manufacturerName: zod_1.z.string().max(255).optional(),
    modelId: zod_1.z.string().max(255).optional(),
    friendlyName: zod_1.z.string().max(255).optional(),
    lastSeen: zod_1.z.coerce.date().optional(),
    definition: zod_1.z.record(zod_1.z.unknown()).optional(),
    capabilities: zod_1.z.array(zod_1.z.string().min(1).max(128)).optional(),
});
exports.createZigbeeStateSchema = zod_1.z.object({
    deviceIeeeAddr: zod_1.z.string().min(3).max(64),
    timestamp: zod_1.z.coerce.date().optional(),
    payload: zod_1.z.record(zod_1.z.unknown()),
    state: zod_1.z.string().max(32).optional(),
    brightness: zod_1.z.coerce.number().int().min(0).max(255).optional(),
    linkquality: zod_1.z.coerce.number().int().min(0).max(255).optional(),
    colorMode: zod_1.z.string().max(32).optional(),
    occupancy: zod_1.z.coerce.boolean().optional(),
    temperature: zod_1.z.coerce.number().optional(),
    humidity: zod_1.z.coerce.number().optional(),
    battery: zod_1.z.coerce.number().optional(),
});
exports.createZigbeeLinksBatchSchema = zod_1.z.object({
    collectedAt: zod_1.z.coerce.date().optional(),
    links: zod_1.z
        .array(zod_1.z.object({
        sourceDeviceId: zod_1.z.string().min(1),
        targetDeviceId: zod_1.z.string().min(1),
        protocol: exports.protocolSchema.default(Protocol.Zigbee),
        linkQuality: zod_1.z.coerce.number().int().optional(),
        rssi: zod_1.z.coerce.number().int().optional(),
        lqi: zod_1.z.coerce.number().int().optional(),
        metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    }))
        .min(1),
});
const listZigbeeDevicesQuerySchemaBase = zod_1.z.object({
    q: zod_1.z.string().max(255).optional(),
    type: exports.zigbeeDeviceTypeSchema.optional(),
});
exports.listZigbeeDevicesQuerySchema = listZigbeeDevicesQuerySchemaBase.merge(pagination_1.paginationQuerySchema);
const listZigbeeStatesQuerySchemaBase = zod_1.z.object({
    deviceIeeeAddr: zod_1.z.string().min(3).max(64),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
});
exports.listZigbeeStatesQuerySchema = listZigbeeStatesQuerySchemaBase.merge(pagination_1.paginationQuerySchema.extend({
    limit: zod_1.z
        .preprocess((v) => (v === '' || v === null || v === undefined ? undefined : v), zod_1.z.coerce.number().int().min(1).max(100).optional())
        .default(50),
}));
const listZigbeeLinksQuerySchemaBase = zod_1.z.object({
    sourceDeviceId: zod_1.z.string().min(1).optional(),
    protocol: exports.protocolSchema.optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
});
const zigbeeLinksPaginationSchema = pagination_1.paginationQuerySchema.extend({
    limit: zod_1.z
        .preprocess((v) => (v === '' || v === null || v === undefined ? undefined : v), zod_1.z.coerce.number().int().min(1).max(200).optional())
        .default(200),
});
exports.listZigbeeLinksQuerySchema = listZigbeeLinksQuerySchemaBase.merge(zigbeeLinksPaginationSchema);
//# sourceMappingURL=zigbee.schemas.js.map