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
exports.ScenarioService = void 0;
const common_1 = require("@nestjs/common");
const scenario_repository_1 = require("./scenario.repository");
let ScenarioService = class ScenarioService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(data) {
        return this.repository.create(data);
    }
    async findMany(query) {
        const { page, limit, houseId, status, creatorId } = query;
        return this.repository.findMany({
            page,
            limit,
            houseId,
            status,
            creatorId,
        });
    }
    async findById(id) {
        const scenario = await this.repository.findById(id);
        if (!scenario)
            throw new common_1.NotFoundException(`Scenario ${id} not found`);
        return scenario;
    }
    async update(id, data) {
        await this.findById(id);
        return this.repository.update(id, data);
    }
    async remove(id) {
        await this.findById(id);
        return this.repository.delete(id);
    }
};
exports.ScenarioService = ScenarioService;
exports.ScenarioService = ScenarioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [scenario_repository_1.ScenarioRepository])
], ScenarioService);
//# sourceMappingURL=scenario.service.js.map