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
exports.IntegrationCatalogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ensure_catalog_request_dto_1 = require("./dto/ensure-catalog-request.dto");
const ensure_catalog_response_dto_1 = require("./dto/ensure-catalog-response.dto");
const integration_catalog_service_1 = require("./integration-catalog.service");
let IntegrationCatalogController = class IntegrationCatalogController {
    constructor(integrationCatalog) {
        this.integrationCatalog = integrationCatalog;
    }
    ensure(body) {
        return this.integrationCatalog.ensureCatalog(body);
    }
};
exports.IntegrationCatalogController = IntegrationCatalogController;
__decorate([
    (0, common_1.Post)('ensure'),
    (0, swagger_1.ApiOperation)({
        summary: 'Идемпотентно обеспечить категорию и абстрактное устройство',
        description: 'Создаёт отсутствующие сущности с `isModerated=false` или возвращает существующие без изменения `isModerated`.',
    }),
    (0, swagger_1.ApiBody)({ type: ensure_catalog_request_dto_1.EnsureCatalogRequestDto }),
    (0, swagger_1.ApiOkResponse)({ type: ensure_catalog_response_dto_1.EnsureCatalogResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ensure_catalog_request_dto_1.EnsureCatalogRequestDto]),
    __metadata("design:returntype", Promise)
], IntegrationCatalogController.prototype, "ensure", null);
exports.IntegrationCatalogController = IntegrationCatalogController = __decorate([
    (0, swagger_1.ApiTags)('Integration'),
    (0, common_1.Controller)('api/v1/integration/catalog'),
    __metadata("design:paramtypes", [integration_catalog_service_1.IntegrationCatalogService])
], IntegrationCatalogController);
