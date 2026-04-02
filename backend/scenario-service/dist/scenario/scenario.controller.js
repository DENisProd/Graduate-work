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
exports.ScenarioController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const scenario_service_1 = require("./scenario.service");
const create_scenario_dto_1 = require("./dto/create-scenario.dto");
const update_scenario_dto_1 = require("./dto/update-scenario.dto");
const scenario_response_dto_1 = require("./dto/scenario-response.dto");
const scenario_schema_1 = require("./schemas/scenario.schema");
const id_params_1 = require("../common/schemas/id-params");
const enums_1 = require("../common/schemas/enums");
const scenario_definition_schema_1 = require("./schemas/scenario-definition.schema");
let ScenarioController = class ScenarioController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findMany(query) {
        const q = scenario_schema_1.listScenariosQuerySchema.parse(query);
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
exports.ScenarioController = ScenarioController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Создать сценарий' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['name', 'status', 'creatorId', 'houseId', 'definition'],
            properties: {
                name: { type: 'string', maxLength: 255 },
                description: { type: 'string', maxLength: 2000 },
                status: {
                    type: 'string',
                    enum: Object.values(enums_1.ScenarioStatus),
                    default: enums_1.ScenarioStatus.OFFLINE,
                },
                creatorId: { type: 'string', maxLength: 255 },
                houseId: { type: 'string', maxLength: 255 },
                definition: {
                    type: 'object',
                    description: 'Универсальное определение сценария: scope/triggers/conditions/actions/options (версия 1). Примеры: HOME / OFFICE.',
                    additionalProperties: true,
                    example: scenario_definition_schema_1.scenarioDefinitionExampleHome,
                },
            },
        },
        examples: {
            HOME: {
                summary: 'Дом: утро по расписанию',
                value: {
                    name: 'Утро',
                    description: 'Включить свет и климат утром',
                    status: enums_1.ScenarioStatus.ONLINE,
                    creatorId: 'user_1',
                    houseId: 'house_123',
                    definition: scenario_definition_schema_1.scenarioDefinitionExampleHome,
                },
            },
            OFFICE: {
                summary: 'Офис: свет по датчику движения',
                value: {
                    name: 'Переговорка: движение → свет',
                    description: 'Включить свет при движении в рабочее время',
                    status: enums_1.ScenarioStatus.ONLINE,
                    creatorId: 'user_2',
                    houseId: 'office_77',
                    definition: scenario_definition_schema_1.scenarioDefinitionExampleOffice,
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Сценарий создан',
        type: scenario_response_dto_1.ScenarioResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Ошибка валидации' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_scenario_dto_1.CreateScenarioDto]),
    __metadata("design:returntype", void 0)
], ScenarioController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список сценариев с пагинацией и фильтрами' }),
    (0, swagger_1.ApiQuery)({
        name: 'houseId',
        required: false,
        type: String,
        description: 'ID дома',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: enums_1.ScenarioStatus,
        description: 'Статус сценария',
    }),
    (0, swagger_1.ApiQuery)({ name: 'creatorId', required: false, description: 'ID создателя' }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: 'Номер страницы (начиная с 1)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Размер страницы (макс. 100)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Список сценариев и общее количество',
        type: scenario_response_dto_1.ScenarioListResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScenarioController.prototype, "findMany", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить сценарий по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ObjectId сценария' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Сценарий найден',
        type: scenario_response_dto_1.ScenarioResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Сценарий не найден' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScenarioController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить сценарий' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ObjectId сценария' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', maxLength: 255 },
                description: { type: 'string', maxLength: 2000, nullable: true },
                status: { type: 'string', enum: Object.values(enums_1.ScenarioStatus) },
                definition: {
                    type: 'object',
                    description: 'Универсальное определение сценария: scope/triggers/conditions/actions/options (версия 1). Примеры: HOME / OFFICE.',
                    additionalProperties: true,
                    example: scenario_definition_schema_1.scenarioDefinitionExampleOffice,
                },
            },
        },
        examples: {
            RENAME_ONLY: {
                summary: 'Переименовать сценарий',
                value: { name: 'Новый заголовок сценария' },
            },
            UPDATE_DEFINITION: {
                summary: 'Обновить definition (пример OFFICE)',
                value: { definition: scenario_definition_schema_1.scenarioDefinitionExampleOffice },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Сценарий обновлён',
        type: scenario_response_dto_1.ScenarioResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Сценарий не найден' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Ошибка валидации' }),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_scenario_dto_1.UpdateScenarioDto]),
    __metadata("design:returntype", void 0)
], ScenarioController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить сценарий' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ObjectId сценария' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Сценарий удалён',
        type: scenario_response_dto_1.ScenarioResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Сценарий не найден' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScenarioController.prototype, "remove", null);
exports.ScenarioController = ScenarioController = __decorate([
    (0, swagger_1.ApiTags)('Scenarios'),
    (0, common_1.Controller)('scenarios'),
    __metadata("design:paramtypes", [scenario_service_1.ScenarioService])
], ScenarioController);
//# sourceMappingURL=scenario.controller.js.map