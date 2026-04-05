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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioExecutionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const scenario_execution_service_1 = require("./scenario-execution.service");
const create_scenario_execution_dto_1 = require("./dto/create-scenario-execution.dto");
const update_scenario_execution_dto_1 = require("./dto/update-scenario-execution.dto");
const scenario_execution_response_dto_1 = require("./dto/scenario-execution-response.dto");
const scenario_execution_schema_1 = require("./schemas/scenario-execution.schema");
const id_params_1 = require("../common/schemas/id-params");
const enums_1 = require("../common/schemas/enums");
let ScenarioExecutionController = class ScenarioExecutionController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findMany(query) {
        const q = scenario_execution_schema_1.listScenarioExecutionsQuerySchema.parse(query);
        return this.service.findMany(q);
    }
    findOne(params) {
        const { id } = id_params_1.idParamSchema.parse(params);
        return this.service.findById(id);
    }
    update(params, dto) {
        const { id } = id_params_1.idParamSchema.parse(params);
        return this.service.update(id, dto);
    }
    remove(params) {
        const { id } = id_params_1.idParamSchema.parse(params);
        return this.service.remove(id);
    }
};
exports.ScenarioExecutionController = ScenarioExecutionController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Создать запись выполнения сценария' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['scenarioId', 'status', 'triggeredBy', 'triggerData'],
            properties: {
                scenarioId: { type: 'string' },
                status: {
                    type: 'string',
                    enum: Object.values(enums_1.ScenarioExecutionStatus),
                    default: enums_1.ScenarioExecutionStatus.RUNNING,
                },
                triggeredBy: {
                    type: 'string',
                    enum: Object.values(enums_1.TriggerSourceType),
                },
                triggerData: { type: 'object' },
                errorMessage: { type: 'string', maxLength: 2000 },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Запись выполнения создана',
        type: scenario_execution_response_dto_1.ScenarioExecutionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Ошибка валидации' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_scenario_execution_dto_1.CreateScenarioExecutionDto]),
    __metadata("design:returntype", void 0)
], ScenarioExecutionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Список выполнений сценариев с пагинацией и фильтрами',
    }),
    (0, swagger_1.ApiQuery)({ name: 'scenarioId', required: false, description: 'ID сценария' }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: enums_1.ScenarioExecutionStatus,
        description: 'Статус выполнения',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'triggeredBy',
        required: false,
        enum: enums_1.TriggerSourceType,
        description: 'Источник запуска',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: 'Номер страницы',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Размер страницы (макс. 100)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Список выполнений и общее количество',
        type: scenario_execution_response_dto_1.ScenarioExecutionListResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScenarioExecutionController.prototype, "findMany", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить выполнение сценария по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ObjectId записи выполнения' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Запись выполнения найдена',
        type: scenario_execution_response_dto_1.ScenarioExecutionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Запись не найдена' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScenarioExecutionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Обновить запись выполнения (например, статус или endedAt)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ObjectId записи выполнения' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: Object.values(enums_1.ScenarioExecutionStatus),
                },
                errorMessage: { type: 'string', maxLength: 2000, nullable: true },
                endedAt: { type: 'string', format: 'date-time', nullable: true },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Запись обновлена',
        type: scenario_execution_response_dto_1.ScenarioExecutionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Запись не найдена' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Ошибка валидации' }),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_scenario_execution_dto_1.UpdateScenarioExecutionDto]),
    __metadata("design:returntype", void 0)
], ScenarioExecutionController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить запись выполнения' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ObjectId записи выполнения' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Запись удалена',
        type: scenario_execution_response_dto_1.ScenarioExecutionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Запись не найдена' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScenarioExecutionController.prototype, "remove", null);
exports.ScenarioExecutionController = ScenarioExecutionController = __decorate([
    (0, swagger_1.ApiTags)('Scenario Executions'),
    (0, common_1.Controller)('scenario-executions'),
    __metadata("design:paramtypes", [scenario_execution_service_1.ScenarioExecutionService])
], ScenarioExecutionController);
//# sourceMappingURL=scenario-execution.controller.js.map