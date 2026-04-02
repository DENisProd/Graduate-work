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
exports.DeviceDataService = void 0;
const common_1 = require("@nestjs/common");
const device_data_repository_1 = require("./device-data.repository");
let DeviceDataService = class DeviceDataService {
    repository;
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
};
exports.DeviceDataService = DeviceDataService;
exports.DeviceDataService = DeviceDataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [device_data_repository_1.DeviceDataRepository])
], DeviceDataService);
//# sourceMappingURL=device-data.service.js.map