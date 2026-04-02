"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePhysicalDeviceDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const physical_device_schema_1 = require("../schemas/physical-device.schema");
class CreatePhysicalDeviceDto extends (0, nestjs_zod_1.createZodDto)(physical_device_schema_1.createPhysicalDeviceSchema) {
}
exports.CreatePhysicalDeviceDto = CreatePhysicalDeviceDto;
//# sourceMappingURL=create-physical-device.dto.js.map