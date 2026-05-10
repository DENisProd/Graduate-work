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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PhysicalDeviceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicalDeviceService = void 0;
const common_1 = require("@nestjs/common");
const physical_device_repository_1 = require("./physical-device.repository");
const device_catalog_service_1 = require("../device-catalog/device-catalog.service");
const device_catalog_client_1 = require("../device-catalog/device-catalog.client");
const access_sync_service_1 = require("../access-sync/access-sync.service");
let PhysicalDeviceService = PhysicalDeviceService_1 = class PhysicalDeviceService {
    repository;
    catalogService;
    catalogClient;
    accessSync;
    logger = new common_1.Logger(PhysicalDeviceService_1.name);
    constructor(repository, catalogService, catalogClient, accessSync) {
        this.repository = repository;
        this.catalogService = catalogService;
        this.catalogClient = catalogClient;
        this.accessSync = accessSync;
    }
    async create(data) {
        return this.repository.create(data);
    }
    async findMany(query) {
        const { page, limit, houseId, roomId } = query;
        return this.repository.findMany({ page, limit, houseId, roomId });
    }
    async findById(id) {
        const device = await this.repository.findById(id);
        if (!device)
            throw new common_1.NotFoundException(`PhysicalDevice ${id} not found`);
        return device;
    }
    async update(id, data) {
        const existing = await this.findById(id);
        const assigningToHouse = data.houseId && data.houseId !== existing.houseId;
        const needsCatalogSync = assigningToHouse && !existing.deviceTypeId && !data.deviceTypeId;
        let resolvedDeviceId = existing.deviceId ?? null;
        if (needsCatalogSync) {
            const sync = await this.catalogService.syncWithCatalog({
                model: existing.model,
                manufacturerName: existing.manufacturerName,
                definition: existing.definition,
                friendlyName: existing.friendlyName,
                ieeeAddr: existing.protocolAddress,
            });
            if (sync.deviceTypeId)
                data = { ...data, deviceTypeId: sync.deviceTypeId };
            if (sync.deviceId) {
                data = { ...data, deviceId: sync.deviceId };
                resolvedDeviceId = sync.deviceId;
            }
            if (sync.deviceCategoryId) {
                data = { ...data, deviceCategoryId: sync.deviceCategoryId };
            }
        }
        const updated = await this.repository.update(id, data);
        const houseId = data.houseId ?? existing.houseId;
        if (needsCatalogSync && resolvedDeviceId && houseId && this.accessSync) {
            await this.syncCapabilityFunctions(updated, resolvedDeviceId, houseId);
        }
        return updated;
    }
    async syncCapabilityFunctions(device, deviceId, houseId) {
        const capabilities = device.capabilities ?? [];
        if (capabilities.length === 0)
            return;
        const functions = await this.catalogClient.findFunctionsByDeviceId(deviceId);
        if (!functions || functions.length === 0)
            return;
        const capabilitySet = new Set(capabilities.map((c) => c.toLowerCase()));
        const matched = functions.filter((fn) => capabilitySet.has(fn.code.toLowerCase()));
        if (matched.length === 0) {
            this.logger.debug(`No matching functions for device ${device.id} (capabilities=[${capabilities.join(', ')}])`);
            return;
        }
        this.logger.log(`Linking ${matched.length}/${functions.length} functions for device ${device.id}`);
        const actions = await this.accessSync.findDeviceFunctionActionsByDeviceId(deviceId);
        const actionIdsByFunctionId = new Map();
        for (const a of actions ?? []) {
            const list = actionIdsByFunctionId.get(a.deviceFunctionId) ?? [];
            list.push(a.id);
            actionIdsByFunctionId.set(a.deviceFunctionId, list);
        }
        await this.accessSync.onDeviceFunctionsLinked(device.id, houseId, matched.map((fn) => ({
            id: fn.id,
            code: fn.code,
            name: fn.name,
            actionIds: actionIdsByFunctionId.get(fn.id) ?? [],
        })));
    }
    async remove(id) {
        await this.findById(id);
        return this.repository.delete(id);
    }
};
exports.PhysicalDeviceService = PhysicalDeviceService;
exports.PhysicalDeviceService = PhysicalDeviceService = PhysicalDeviceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [physical_device_repository_1.PhysicalDeviceRepository,
        device_catalog_service_1.DeviceCatalogService,
        device_catalog_client_1.DeviceCatalogClient,
        access_sync_service_1.AccessSyncService])
], PhysicalDeviceService);
//# sourceMappingURL=physical-device.service.js.map