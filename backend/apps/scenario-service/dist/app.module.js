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
const mongoose_1 = require("@nestjs/mongoose");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const devices_module_1 = require("./devices/devices.module");
const scenario_module_1 = require("./scenario/scenario.module");
const scenario_execution_module_1 = require("./scenario-execution/scenario-execution.module");
const device_data_module_1 = require("./device-data/device-data.module");
const zigbee_module_1 = require("./zigbee/zigbee.module");
const llm_module_1 = require("./llm/llm.module");
const widget_dashboard_module_1 = require("./widget-dashboard/widget-dashboard.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                envFilePath: (0, path_1.join)(__dirname, '../../.env'),
                isGlobal: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            mongoose_1.MongooseModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const url = config.get('SCENARIO_DATABASE_URL') ??
                        process.env.SCENARIO_DATABASE_URL;
                    if (!url) {
                        throw new Error('SCENARIO_DATABASE_URL is not set');
                    }
                    return { uri: url };
                },
            }),
            llm_module_1.LlmModule,
            devices_module_1.DevicesModule,
            scenario_module_1.ScenarioModule,
            scenario_execution_module_1.ScenarioExecutionModule,
            device_data_module_1.DeviceDataModule,
            zigbee_module_1.ZigbeeModule,
            widget_dashboard_module_1.WidgetDashboardModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map