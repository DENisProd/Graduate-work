"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DeviceDataGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceDataGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const enums_1 = require("../common/schemas/enums");
const physical_device_service_1 = require("../devices/physical-device.service");
const device_data_service_1 = require("./device-data.service");
let DeviceDataGeneratorService = DeviceDataGeneratorService_1 = class DeviceDataGeneratorService {
    deviceDataService;
    physicalDeviceService;
    logger = new common_1.Logger(DeviceDataGeneratorService_1.name);
    enabled() {
        const raw = process.env.DEVICE_DATA_GENERATOR_ENABLED;
        if (!raw)
            return false;
        const v = raw.trim().toLowerCase();
        return v === 'true' || v === '1' || v === 'yes' || v === 'on';
    }
    constructor(deviceDataService, physicalDeviceService) {
        this.deviceDataService = deviceDataService;
        this.physicalDeviceService = physicalDeviceService;
    }
    async generateRandomDataForDevices() {
        if (!this.enabled())
            return;
        const devices = await this.getAllDevices();
        if (!devices.length)
            return;
        const timestamp = new Date();
        await Promise.all(devices.map((device) => {
            const payload = this.buildRandomPayload(device.deviceTypeId, device.id, timestamp);
            return this.deviceDataService.create(payload);
        }));
    }
    async getAllDevices() {
        const limit = 100;
        let page = 1;
        const all = [];
        for (;;) {
            const { items, total } = await this.physicalDeviceService.findMany({
                page,
                limit,
            });
            if (!items.length)
                break;
            all.push(...items
                .filter((item) => typeof item.deviceTypeId === 'number')
                .map((item) => ({
                id: item.id,
                deviceTypeId: item.deviceTypeId,
            })));
            if (all.length >= total)
                break;
            page += 1;
        }
        return all;
    }
    buildRandomPayload(deviceTypeId, deviceId, timestamp) {
        const types = Object.values(enums_1.DeviceDataType);
        const type = types[Math.floor(Math.random() * types.length)];
        let unit;
        let value;
        let capability;
        let attribute;
        switch (type) {
            case enums_1.DeviceDataType.FLOAT: {
                unit = '°C';
                capability = 'temperature_sensor';
                attribute = 'value';
                value = { value: this.randomFloat(18, 26), unit };
                break;
            }
            case enums_1.DeviceDataType.NUMBER: {
                unit = 'W';
                capability = 'power';
                attribute = 'value';
                value = { value: this.randomInt(0, 2000), unit };
                break;
            }
            case enums_1.DeviceDataType.STRING: {
                unit = undefined;
                const states = ['idle', 'running', 'error'];
                capability = 'status';
                attribute = 'state';
                value = states[Math.floor(Math.random() * states.length)];
                break;
            }
            case enums_1.DeviceDataType.BOOLEAN:
            default: {
                unit = undefined;
                capability = 'switch';
                attribute = 'state';
                value = { on: Math.random() > 0.5 };
                break;
            }
        }
        const base = {
            deviceId,
            capability,
            ...(attribute ? { attribute } : {}),
            type,
            value,
            unit,
            timestamp,
        };
        return base;
    }
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    randomInt(min, max) {
        return Math.floor(this.randomFloat(min, max + 1));
    }
};
exports.DeviceDataGeneratorService = DeviceDataGeneratorService;
__decorate([
    (0, schedule_1.Interval)(30_000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceDataGeneratorService.prototype, "generateRandomDataForDevices", null);
exports.DeviceDataGeneratorService = DeviceDataGeneratorService = DeviceDataGeneratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [device_data_service_1.DeviceDataService,
        physical_device_service_1.PhysicalDeviceService])
], DeviceDataGeneratorService);
//# sourceMappingURL=device-data.generator.js.map