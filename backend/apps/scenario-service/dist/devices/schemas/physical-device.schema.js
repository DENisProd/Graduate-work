"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPhysicalDevicesQuerySchema = exports.updatePhysicalDeviceSchema = exports.createPhysicalDeviceSchema = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../common/schemas/pagination");
exports.createPhysicalDeviceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().max(1000).optional(),
    deviceTypeId: zod_1.z.coerce.number().int().min(1).optional(),
    houseId: zod_1.z.string().min(1).max(255),
    deviceId: zod_1.z.string().max(255).optional(),
    roomId: zod_1.z.string().max(255).optional(),
    firmwareVersion: zod_1.z.string().max(100).optional(),
    ipAddress: zod_1.z.string().ip().optional().or(zod_1.z.literal('')),
    macAddress: zod_1.z.string().max(17).optional(),
    serialNumber: zod_1.z.string().max(100).optional(),
});
exports.updatePhysicalDeviceSchema = exports.createPhysicalDeviceSchema.partial();
const listPhysicalDevicesQuerySchemaBase = zod_1.z.object({
    houseId: zod_1.z.string().min(1).max(255).optional(),
    roomId: zod_1.z.string().optional(),
});
exports.listPhysicalDevicesQuerySchema = listPhysicalDevicesQuerySchemaBase.merge(pagination_1.paginationQuerySchema);
//# sourceMappingURL=physical-device.schema.js.map