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
const map_zigbee_payload_to_device_data_1 = require("./ingestion/map-zigbee-payload-to-device-data");
const device_data_repository_1 = require("./device-data.repository");
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
    async series(query) {
        const capabilities = query.capabilities
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean) ?? undefined;
        return this.repository.series({
            deviceId: query.deviceId,
            range: query.range,
            capabilities,
            to: query.to,
        });
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
        const rows = (0, map_zigbee_payload_to_device_data_1.mapZigbeePayloadToDeviceDataInputs)(physicalDeviceId, payload, at);
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