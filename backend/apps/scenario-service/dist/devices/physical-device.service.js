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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicalDeviceService = void 0;
const common_1 = require("@nestjs/common");
const physical_device_repository_1 = require("./physical-device.repository");
const device_catalog_service_1 = require("../device-catalog/device-catalog.service");
let PhysicalDeviceService = class PhysicalDeviceService {
    repository;
    catalogService;
    constructor(repository, catalogService) {
        this.repository = repository;
        this.catalogService = catalogService;
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
            if (sync.deviceId)
                data = { ...data, deviceId: sync.deviceId };
            if (sync.deviceCategoryId) {
                data = { ...data, deviceCategoryId: sync.deviceCategoryId };
            }
        }
        return this.repository.update(id, data);
    }
    async remove(id) {
        await this.findById(id);
        return this.repository.delete(id);
    }
};
exports.PhysicalDeviceService = PhysicalDeviceService;
exports.PhysicalDeviceService = PhysicalDeviceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [physical_device_repository_1.PhysicalDeviceRepository,
        device_catalog_service_1.DeviceCatalogService])
], PhysicalDeviceService);
//# sourceMappingURL=physical-device.service.js.map