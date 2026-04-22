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
var DeviceCatalogClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceCatalogClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let DeviceCatalogClient = DeviceCatalogClient_1 = class DeviceCatalogClient {
    logger = new common_1.Logger(DeviceCatalogClient_1.name);
    baseUrl;
    constructor(config) {
        this.baseUrl = (config.get('DEVICE_SERVICE_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
    }
    async get(path) {
        try {
            const res = await fetch(`${this.baseUrl}${path}`);
            if (res.status === 404)
                return null;
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return res.json();
        }
        catch (e) {
            this.logger.error(`GET ${path} failed: ${e instanceof Error ? e.message : String(e)}`);
            return null;
        }
    }
    async post(path, body) {
        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
            }
            return res.json();
        }
        catch (e) {
            this.logger.error(`POST ${path} failed: ${e instanceof Error ? e.message : String(e)}`);
            return null;
        }
    }
    findDeviceByCode(code) {
        return this.get(`/api/v1/devices/code/${encodeURIComponent(code)}`);
    }
    findDeviceTypeByCode(code) {
        return this.get(`/api/v1/device-types/code/${encodeURIComponent(code)}`);
    }
    findDeviceCategoryByCode(code) {
        return this.get(`/api/v1/device-categories/code/${encodeURIComponent(code)}`);
    }
    createDeviceType(code, name) {
        return this.post('/api/v1/admin/device-types', {
            code,
            active: true,
            translations: { en: { name }, ru: { name } },
        });
    }
    createDeviceCategory(code, name, deviceTypeId) {
        return this.post('/api/v1/admin/device-categories', {
            code,
            deviceTypeId,
            active: true,
            translations: { en: { name }, ru: { name } },
        });
    }
    createDevice(code, name, deviceCategoryId) {
        return this.post('/api/v1/admin/devices', {
            code,
            deviceCategoryId,
            status: 'OFFLINE',
            active: true,
            translations: { en: { name }, ru: { name } },
        });
    }
    createDeviceFunction(code, name, deviceId, functionType = 'READ_WRITE') {
        return this.post('/api/v1/admin/device-functions', {
            code,
            deviceId,
            functionType,
            active: true,
            translations: { en: { name }, ru: { name } },
        });
    }
};
exports.DeviceCatalogClient = DeviceCatalogClient;
exports.DeviceCatalogClient = DeviceCatalogClient = DeviceCatalogClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DeviceCatalogClient);
//# sourceMappingURL=device-catalog.client.js.map