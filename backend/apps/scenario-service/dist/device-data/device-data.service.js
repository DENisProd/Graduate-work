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
var DeviceDataService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceDataService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const enums_1 = require("../common/schemas/enums");
const device_data_repository_1 = require("./device-data.repository");
function asNumber(v) {
    if (typeof v === 'number' && Number.isFinite(v))
        return v;
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        if (Number.isFinite(n))
            return n;
    }
    return undefined;
}
function asBoolean(v) {
    if (typeof v === 'boolean')
        return v;
    if (typeof v === 'number')
        return v === 1 ? true : v === 0 ? false : undefined;
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(s))
            return true;
        if (['false', '0', 'no', 'off'].includes(s))
            return false;
    }
    return undefined;
}
let DeviceDataService = DeviceDataService_1 = class DeviceDataService {
    repository;
    logger = new common_1.Logger(DeviceDataService_1.name);
    constructor(repository) {
        this.repository = repository;
    }
    async create(data) {
        return this.repository.create(data);
    }
    async findMany(query) {
        return this.repository.findMany(query);
    }
    async findById(id) {
        const row = await this.repository.findById(id);
        if (!row)
            throw new common_1.NotFoundException(`DeviceData ${id} not found`);
        return row;
    }
    async remove(id) {
        await this.findById(id);
        return this.repository.delete(id);
    }
    async ingestFromZigbeePayload(physicalDeviceId, payload, at) {
        if (!(0, mongoose_1.isValidObjectId)(physicalDeviceId))
            return;
        const rows = [];
        const addNum = (capability, attribute, v, unit) => {
            const n = asNumber(v);
            if (n === undefined)
                return;
            const isFloat = !Number.isInteger(n);
            rows.push({
                deviceId: physicalDeviceId,
                capability,
                attribute,
                type: isFloat ? enums_1.DeviceDataType.FLOAT : enums_1.DeviceDataType.NUMBER,
                value: n,
                ...(unit ? { unit } : {}),
                timestamp: at,
            });
        };
        const addBool = (capability, attribute, v) => {
            const b = asBoolean(v);
            if (b === undefined)
                return;
            rows.push({
                deviceId: physicalDeviceId,
                capability,
                attribute,
                type: enums_1.DeviceDataType.BOOLEAN,
                value: b,
                timestamp: at,
            });
        };
        addNum('battery', 'level', payload.battery, '%');
        addBool('battery', 'low', payload.battery_low);
        addNum('zigbee', 'linkquality', payload.linkquality);
        addBool('occupancy', 'motion', payload.occupancy);
        addBool('tamper', 'active', payload.tamper);
        addNum('power', 'voltage', payload.voltage, 'mV');
        addNum('climate', 'temperature', payload.temperature, '°C');
        addNum('climate', 'humidity', payload.humidity, '%');
        addNum('light', 'brightness', payload.brightness);
        addNum('climate', 'pressure', payload.pressure, 'hPa');
        addNum('illuminance', 'value', payload.illuminance, 'lx');
        const state = payload.state;
        if (typeof state === 'string' && state.length > 0) {
            rows.push({
                deviceId: physicalDeviceId,
                capability: 'switch',
                attribute: 'state',
                type: enums_1.DeviceDataType.STRING,
                value: state,
                timestamp: at,
            });
        }
        addBool('contact', 'open', payload.contact);
        addBool('water_leak', 'detected', payload.water_leak);
        if (rows.length === 0)
            return;
        try {
            await Promise.all(rows.map((r) => this.repository.create(r)));
        }
        catch (e) {
            this.logger.warn(`DeviceData ingest: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
};
exports.DeviceDataService = DeviceDataService;
exports.DeviceDataService = DeviceDataService = DeviceDataService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [device_data_repository_1.DeviceDataRepository])
], DeviceDataService);
//# sourceMappingURL=device-data.service.js.map