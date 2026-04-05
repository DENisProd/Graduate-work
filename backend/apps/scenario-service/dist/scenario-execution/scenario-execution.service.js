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
exports.ScenarioExecutionService = void 0;
const common_1 = require("@nestjs/common");
const scenario_execution_repository_1 = require("./scenario-execution.repository");
let ScenarioExecutionService = class ScenarioExecutionService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(data) {
        return this.repository.create(data);
    }
    async findMany(query) {
        const { page, limit, scenarioId, status, triggeredBy } = query;
        return this.repository.findMany({
            page,
            limit,
            scenarioId,
            status,
            triggeredBy,
        });
    }
    async findById(id) {
        const execution = await this.repository.findById(id);
        if (!execution)
            throw new common_1.NotFoundException(`ScenarioExecution ${id} not found`);
        return execution;
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
exports.ScenarioExecutionService = ScenarioExecutionService;
exports.ScenarioExecutionService = ScenarioExecutionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [scenario_execution_repository_1.ScenarioExecutionRepository])
], ScenarioExecutionService);
//# sourceMappingURL=scenario-execution.service.js.map