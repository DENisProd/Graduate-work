"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const devices_module_1 = require("./devices/devices.module");
const prisma_module_1 = require("./prisma/prisma.module");
const device_types_module_1 = require("./device-types/device-types.module");
const device_categories_module_1 = require("./device-categories/device-categories.module");
const device_functions_module_1 = require("./device-functions/device-functions.module");
const device_function_actions_module_1 = require("./device-function-actions/device-function-actions.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: (0, path_1.join)(__dirname, '../../../.env'),
            }),
            prisma_module_1.PrismaModule,
            devices_module_1.DevicesModule,
            device_types_module_1.DeviceTypesModule,
            device_categories_module_1.DeviceCategoriesModule,
            device_functions_module_1.DeviceFunctionsModule,
            device_function_actions_module_1.DeviceFunctionActionsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
