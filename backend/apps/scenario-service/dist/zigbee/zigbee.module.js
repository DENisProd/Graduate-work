"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZigbeeModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const zigbee_controller_1 = require("./zigbee.controller");
const zigbee_service_1 = require("./zigbee.service");
const zigbee_device_repository_1 = require("./zigbee-device.repository");
const zigbee_link_repository_1 = require("./zigbee-link.repository");
const zigbee_state_repository_1 = require("./zigbee-state.repository");
const physical_device_mongo_1 = require("../mongo/schemas/physical-device.mongo");
const device_network_link_mongo_1 = require("../mongo/schemas/device-network-link.mongo");
const zigbee_state_mongo_1 = require("../mongo/schemas/zigbee-state.mongo");
const zigbee_device_log_mongo_1 = require("../mongo/schemas/zigbee-device-log.mongo");
const zigbee_mqtt_service_1 = require("./zigbee-mqtt.service");
const zigbee_ingest_service_1 = require("./zigbee-ingest.service");
const zigbee_device_log_repository_1 = require("./zigbee-device-log.repository");
const zigbee_realtime_service_1 = require("./zigbee-realtime.service");
const zigbee_realtime_gateway_1 = require("./zigbee-realtime.gateway");
const device_data_module_1 = require("../device-data/device-data.module");
let ZigbeeModule = class ZigbeeModule {
};
exports.ZigbeeModule = ZigbeeModule;
exports.ZigbeeModule = ZigbeeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            device_data_module_1.DeviceDataModule,
            mongoose_1.MongooseModule.forFeature([
                { name: physical_device_mongo_1.PHYSICAL_DEVICE_MODEL, schema: physical_device_mongo_1.PhysicalDeviceSchema },
                { name: device_network_link_mongo_1.DEVICE_NETWORK_LINK_MODEL, schema: device_network_link_mongo_1.DeviceNetworkLinkSchema },
                { name: zigbee_state_mongo_1.ZIGBEE_STATE_MODEL, schema: zigbee_state_mongo_1.ZigbeeStateSchema },
                { name: zigbee_device_log_mongo_1.ZIGBEE_DEVICE_LOG_MODEL, schema: zigbee_device_log_mongo_1.ZigbeeDeviceLogSchema },
            ]),
        ],
        controllers: [zigbee_controller_1.ZigbeeController],
        providers: [
            zigbee_service_1.ZigbeeService,
            zigbee_ingest_service_1.ZigbeeIngestService,
            zigbee_mqtt_service_1.ZigbeeMqttService,
            zigbee_device_repository_1.ZigbeeDeviceRepository,
            zigbee_link_repository_1.ZigbeeLinkRepository,
            zigbee_state_repository_1.ZigbeeStateRepository,
            zigbee_device_log_repository_1.ZigbeeDeviceLogRepository,
            zigbee_realtime_service_1.ZigbeeRealtimeService,
            zigbee_realtime_gateway_1.ZigbeeRealtimeGateway,
        ],
        exports: [zigbee_service_1.ZigbeeService, zigbee_ingest_service_1.ZigbeeIngestService],
    })
], ZigbeeModule);
//# sourceMappingURL=zigbee.module.js.map