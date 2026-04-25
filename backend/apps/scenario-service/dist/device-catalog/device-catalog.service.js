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
function titleFromCode(s) {
    const normalized = toLowerCode(s, 120);
    if (!normalized)
        return 'Unknown';
    return normalized
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
let DeviceCatalogService = DeviceCatalogService_1 = class DeviceCatalogService {
    client;
    logger = new common_1.Logger(DeviceCatalogService_1.name);
    constructor(client) {
        this.client = client;
    }
    async syncWithCatalog(input) {
        const modelFromDefinition = typeof input.definition?.model === 'string'
            ? input.definition.model
            : null;
        const model = modelFromDefinition?.trim() || input.model?.trim() || null;
        if (!model && !input.ieeeAddr?.trim()) {
            return { deviceTypeId: null, deviceId: null, deviceCategoryId: null };
        }
        const categoryCode = this.buildCategoryCode({
            manufacturerName: input.manufacturerName,
            model,
            definition: input.definition ?? null,
        });
        const deviceCode = this.buildDeviceCode({
            manufacturerName: input.manufacturerName,
            model,
            definition: input.definition ?? null,
            ieeeAddr: input.ieeeAddr,
        });
        if (!deviceCode) {
            return { deviceTypeId: null, deviceId: null, deviceCategoryId: null };
        }
        const typeName = titleFromCode(ZIGBEE_TYPE_CODE);
        const categoryName = titleFromCode(categoryCode);
        const deviceName = this.pickDeviceName(input.friendlyName, model, deviceCode);
        try {
            const ensured = await this.client.ensureCatalog({
                deviceTypeCode: ZIGBEE_TYPE_CODE,
                deviceCategoryCode: categoryCode,
                deviceCode,
                translations: {
                    deviceType: {
                        en: { name: typeName },
                        ru: { name: typeName },
                    },
                    deviceCategory: {
                        en: { name: categoryName },
                        ru: { name: categoryName },
                    },
                    device: {
                        en: { name: deviceName },
                        ru: { name: deviceName },
                    },
                },
            });
            if (!ensured) {
                return { deviceTypeId: null, deviceId: null, deviceCategoryId: null };
            }
            if (ensured.created.category || ensured.created.device) {
                this.logger.log(`Catalog ensured for code=${deviceCode}: categoryCreated=${ensured.created.category}, deviceCreated=${ensured.created.device}`);
            }
            const zigbeeType = await this.client.findDeviceTypeByCode(ZIGBEE_TYPE_CODE);
            return {
                deviceTypeId: zigbeeType?.id ?? null,
                deviceId: ensured.deviceId,
                deviceCategoryId: ensured.deviceCategoryId,
            };
        }
        catch (e) {
            this.logger.error(`syncWithCatalog failed for code=${deviceCode}: ${e instanceof Error ? e.message : String(e)}`);
            return { deviceTypeId: null, deviceId: null, deviceCategoryId: null };
        }
    }
    buildCategoryCode(input) {
        const manufacturer = input.manufacturerName?.trim();
        const model = input.model?.trim();
        if (manufacturer && model) {
            const code = toUpperCode(`${manufacturer}_${model}`);
            if (code)
                return `ZIGBEE_${code}`.slice(0, 50);
        }
        if (model) {
            const code = toUpperCode(model);
            if (code)
                return `ZIGBEE_${code}`.slice(0, 50);
        }
        const definitionModel = typeof input.definition?.model === 'string'
            ? input.definition.model.trim()
            : '';
        if (definitionModel) {
            const code = toUpperCode(definitionModel);
            if (code)
                return `ZIGBEE_${code}`.slice(0, 50);
        }
        return 'ZIGBEE_UNKNOWN';
    }
    buildDeviceCode(input) {
        const manufacturer = input.manufacturerName?.trim();
        const model = input.model?.trim();
        if (manufacturer && model) {
            const code = toUpperCode(`ZIGBEE_${manufacturer}_${model}`, 100);
            if (code)
                return code;
        }
        if (model) {
            const code = toUpperCode(`ZIGBEE_${model}`, 100);
            if (code)
                return code;
        }
        const definitionModel = typeof input.definition?.model === 'string'
            ? input.definition.model.trim()
            : '';
        if (definitionModel) {
            const code = toUpperCode(`ZIGBEE_${definitionModel}`, 100);
            if (code)
                return code;
        }
        const ieee = input.ieeeAddr?.trim();
        if (ieee) {
            const code = toUpperCode(`ZIGBEE_${ieee}`, 100);
            if (code)
                return code;
        }
        return null;
    }
    pickDeviceName(friendlyName, model, fallbackCode) {
        const fn = friendlyName?.trim();
        if (fn)
            return fn;
        const md = model?.trim();
        if (md)
            return md;
        return titleFromCode(fallbackCode ?? 'unknown');
    }
};
exports.DeviceCatalogService = DeviceCatalogService;
exports.DeviceCatalogService = DeviceCatalogService = DeviceCatalogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [device_catalog_client_1.DeviceCatalogClient])
], DeviceCatalogService);
//# sourceMappingURL=device-catalog.service.js.map