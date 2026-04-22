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
var DeviceCatalogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceCatalogService = void 0;
const common_1 = require("@nestjs/common");
const device_catalog_client_1 = require("./device-catalog.client");
const ZIGBEE_TYPE_CODE = 'ZIGBEE';
const READ_ONLY_CAPABILITIES = new Set([
    'battery',
    'battery_low',
    'battery_voltage',
    'co2',
    'contact',
    'current',
    'energy',
    'humidity',
    'illuminance',
    'illuminance_lux',
    'linkquality',
    'power',
    'pressure',
    'temperature',
    'voltage',
    'water_leak',
    'smoke',
    'gas',
    'carbon_monoxide',
    'tamper',
    'vibration',
    'action',
]);
function toUpperCode(s, maxLen = 50) {
    return s
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, maxLen);
}
function toLowerCode(s, maxLen = 50) {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, maxLen);
}
function functionType(capability) {
    return READ_ONLY_CAPABILITIES.has(capability) ? 'READ' : 'READ_WRITE';
}
let DeviceCatalogService = DeviceCatalogService_1 = class DeviceCatalogService {
    client;
    logger = new common_1.Logger(DeviceCatalogService_1.name);
    constructor(client) {
        this.client = client;
    }
    async syncWithCatalog(input) {
        const model = input.model?.trim();
        if (!model) {
            return { deviceTypeId: null, abstractDeviceId: null };
        }
        try {
            const existing = await this.client.findDeviceByCode(model);
            if (existing) {
                this.logger.debug(`Catalog hit: model=${model} → abstractDeviceId=${existing.id}`);
                const typeId = await this.resolveTypeId(existing.category);
                return { deviceTypeId: typeId, abstractDeviceId: existing.id };
            }
            const deviceType = await this.findOrCreateDeviceType();
            if (!deviceType) {
                this.logger.warn('Cannot find/create ZIGBEE device type — skipping sync');
                return { deviceTypeId: null, abstractDeviceId: null };
            }
            const categoryCode = this.buildCategoryCode(input.manufacturerName);
            const categoryName = input.manufacturerName?.trim()
                ? `Zigbee ${input.manufacturerName.trim()}`
                : 'Zigbee Generic';
            const category = await this.findOrCreateCategory(categoryCode, categoryName, deviceType.id);
            if (!category) {
                this.logger.warn(`Cannot find/create category ${categoryCode} — returning typeId only`);
                return { deviceTypeId: deviceType.id, abstractDeviceId: null };
            }
            const device = await this.client.createDevice(model, model, category.id);
            if (!device) {
                this.logger.warn(`Cannot create abstract device ${model} in catalog`);
                return { deviceTypeId: deviceType.id, abstractDeviceId: null };
            }
            this.logger.log(`Created catalog entry: model=${model} type=${ZIGBEE_TYPE_CODE} category=${categoryCode} abstractDeviceId=${device.id}`);
            await this.createFunctions(device.id, input.capabilities ?? []);
            return { deviceTypeId: deviceType.id, abstractDeviceId: device.id };
        }
        catch (e) {
            this.logger.error(`syncWithCatalog failed for model=${model}: ${e instanceof Error ? e.message : String(e)}`);
            return { deviceTypeId: null, abstractDeviceId: null };
        }
    }
    async resolveTypeId(category) {
        if (!category)
            return null;
        if (category.deviceType?.id)
            return category.deviceType.id;
        if (category.code) {
            const full = await this.client.findDeviceCategoryByCode(category.code);
            if (full?.deviceType?.id)
                return full.deviceType.id;
        }
        const type = await this.client.findDeviceTypeByCode(ZIGBEE_TYPE_CODE);
        return type?.id ?? null;
    }
    async findOrCreateDeviceType() {
        const existing = await this.client.findDeviceTypeByCode(ZIGBEE_TYPE_CODE);
        if (existing)
            return existing;
        const created = await this.client.createDeviceType(ZIGBEE_TYPE_CODE, 'Zigbee');
        if (created)
            return created;
        return this.client.findDeviceTypeByCode(ZIGBEE_TYPE_CODE);
    }
    async findOrCreateCategory(code, name, deviceTypeId) {
        const existing = await this.client.findDeviceCategoryByCode(code);
        if (existing)
            return existing;
        const created = await this.client.createDeviceCategory(code, name, deviceTypeId);
        if (created)
            return created;
        return this.client.findDeviceCategoryByCode(code);
    }
    buildCategoryCode(manufacturer) {
        if (!manufacturer?.trim())
            return 'ZIGBEE_GENERIC';
        const suffix = toUpperCode(manufacturer.trim(), 40);
        if (!suffix)
            return 'ZIGBEE_GENERIC';
        return `ZIGBEE_${suffix}`.slice(0, 50);
    }
    async createFunctions(deviceId, capabilities) {
        for (const cap of capabilities) {
            const code = toLowerCode(cap);
            if (!code || !/^[a-z][a-z0-9_]*$/.test(code))
                continue;
            const result = await this.client.createDeviceFunction(code, cap, deviceId, functionType(cap));
            if (!result) {
                this.logger.debug(`Skipped function ${code} for device ${deviceId} (may already exist)`);
            }
        }
    }
};
exports.DeviceCatalogService = DeviceCatalogService;
exports.DeviceCatalogService = DeviceCatalogService = DeviceCatalogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [device_catalog_client_1.DeviceCatalogClient])
], DeviceCatalogService);
//# sourceMappingURL=device-catalog.service.js.map