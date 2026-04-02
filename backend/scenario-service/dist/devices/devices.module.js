"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const physical_device_controller_1 = require("./physical-device.controller");
const physical_device_service_1 = require("./physical-device.service");
const physical_device_repository_1 = require("./physical-device.repository");
const physical_device_mongo_1 = require("../mongo/schemas/physical-device.mongo");
let DevicesModule = class DevicesModule {
};
exports.DevicesModule = DevicesModule;
exports.DevicesModule = DevicesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: physical_device_mongo_1.PHYSICAL_DEVICE_MODEL, schema: physical_device_mongo_1.PhysicalDeviceSchema },
            ]),
        ],
        controllers: [physical_device_controller_1.PhysicalDeviceController],
        providers: [physical_device_service_1.PhysicalDeviceService, physical_device_repository_1.PhysicalDeviceRepository],
        exports: [physical_device_service_1.PhysicalDeviceService],
    })
], DevicesModule);
//# sourceMappingURL=devices.module.js.map