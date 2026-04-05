"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePhysicalDeviceDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const physical_device_schema_1 = require("../schemas/physical-device.schema");
class UpdatePhysicalDeviceDto extends (0, nestjs_zod_1.createZodDto)(physical_device_schema_1.updatePhysicalDeviceSchema) {
}
exports.UpdatePhysicalDeviceDto = UpdatePhysicalDeviceDto;
//# sourceMappingURL=update-physical-device.dto.js.map