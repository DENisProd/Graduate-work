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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_service_1 = require("./audit.service");
const audit_list_response_dto_1 = require("./dto/audit-list-response.dto");
function toResponse(log) {
    return {
        id: log.id,
        actorId: log.actorId,
        action: log.action,
        resourceId: log.resourceId ?? undefined,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
    };
}
let AuditController = class AuditController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async findAll(actorId, resourceId, action, page, size) {
        const p = Math.max(0, parseInt(page ?? '0', 10) || 0);
        const s = Math.max(1, Math.min(100, parseInt(size ?? '20', 10) || 20));
        const { content, total } = await this.auditService.findAll({
            actorId,
            resourceId,
            action,
            page: p,
            size: s,
        });
        return { content: content.map(toResponse), total };
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Журнал аудита',
        description: 'Фильтрация по субъекту, ресурсу и типу действия; пагинация `page`/`size` (size ≤ 100).',
    }),
    (0, swagger_1.ApiQuery)({ name: 'actorId', required: false, description: 'ID субъекта действия' }),
    (0, swagger_1.ApiQuery)({
        name: 'resourceId',
        required: false,
        schema: { type: 'string', format: 'uuid' },
    }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, description: 'Код действия' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: '0' }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: '20', description: 'Размер страницы, макс. 100' }),
    (0, swagger_1.ApiOkResponse)({ type: audit_list_response_dto_1.AuditListResponseDto }),
    __param(0, (0, common_1.Query)('actorId')),
    __param(1, (0, common_1.Query)('resourceId')),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "findAll", null);
exports.AuditController = AuditController = __decorate([
    (0, swagger_1.ApiTags)('Audit'),
    (0, common_1.Controller)('audit'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
