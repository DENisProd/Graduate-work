"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDeviceDataDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const device_data_schema_1 = require("../schemas/device-data.schema");
class CreateDeviceDataDto extends (0, nestjs_zod_1.createZodDto)(device_data_schema_1.createDeviceDataSchema) {
}
exports.CreateDeviceDataDto = CreateDeviceDataDto;
//# sourceMappingURL=create-device-data.dto.js.map