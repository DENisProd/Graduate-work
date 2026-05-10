"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceDataModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const device_data_controller_1 = require("./device-data.controller");
const device_data_service_1 = require("./device-data.service");
const device_data_repository_1 = require("./device-data.repository");
const devices_module_1 = require("../devices/devices.module");
const device_data_mongo_1 = require("../mongo/schemas/device-data.mongo");
let DeviceDataModule = class DeviceDataModule {
};
exports.DeviceDataModule = DeviceDataModule;
exports.DeviceDataModule = DeviceDataModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: device_data_mongo_1.DEVICE_DATA_MODEL, schema: device_data_mongo_1.DeviceDataSchema },
            ]),
            devices_module_1.DevicesModule,
        ],
        controllers: [device_data_controller_1.DeviceDataController],
        providers: [
            device_data_service_1.DeviceDataService,
            device_data_repository_1.DeviceDataRepository,
        ],
        exports: [device_data_service_1.DeviceDataService],
    })
], DeviceDataModule);
//# sourceMappingURL=device-data.module.js.map