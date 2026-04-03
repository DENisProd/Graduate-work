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
exports.ResourcesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const resources_service_1 = require("./resources.service");
const create_resource_dto_1 = require("./dto/create-resource.dto");
const resource_response_dto_1 = require("./dto/resource-response.dto");
const resource_tree_node_dto_1 = require("./dto/resource-tree-node.dto");
const toResponse = (r) => ({
    id: r.id,
    houseId: r.houseId,
    type: r.type,
    externalId: r.externalId ?? undefined,
    parentId: r.parentId ?? undefined,
    path: r.path,
    depth: r.depth,
    createdAt: r.createdAt.toISOString(),
});
let ResourcesController = class ResourcesController {
    constructor(resourcesService) {
        this.resourcesService = resourcesService;
    }
    async create(dto) {
        const resource = await this.resourcesService.create(dto);
        return toResponse(resource);
    }
    async findById(id) {
        const resource = await this.resourcesService.findById(id);
        return toResponse(resource);
    }
    async getTree(houseId) {
        return this.resourcesService.getTreeByHouseId(houseId);
    }
};
exports.ResourcesController = ResourcesController;
__decorate([
    (0, common_1.Post)('resources'),
    (0, swagger_1.ApiOperation)({
        summary: 'Создать ресурс',
        description: 'Типы: ROOM, DEVICE, DEVICE_FUNCTION и др. (см. enum ResourceType в схеме).',
    }),
    (0, swagger_1.ApiBody)({ type: create_resource_dto_1.CreateResourceDto }),
    (0, swagger_1.ApiCreatedResponse)({ type: resource_response_dto_1.ResourceResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_resource_dto_1.CreateResourceDto]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('resources/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить ресурс по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid' }),
    (0, swagger_1.ApiOkResponse)({ type: resource_response_dto_1.ResourceResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('houses/:houseId/resources/tree'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить дерево ресурсов дома' }),
    (0, swagger_1.ApiParam)({ name: 'houseId', format: 'uuid' }),
    (0, swagger_1.ApiOkResponse)({ type: resource_tree_node_dto_1.ResourceTreeNodeDto, isArray: true }),
    __param(0, (0, common_1.Param)('houseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "getTree", null);
exports.ResourcesController = ResourcesController = __decorate([
    (0, swagger_1.ApiTags)('Resources'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [resources_service_1.ResourcesService])
], ResourcesController);
