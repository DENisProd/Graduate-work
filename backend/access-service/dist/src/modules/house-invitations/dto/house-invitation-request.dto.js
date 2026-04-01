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
exports.HouseInvitationRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_2 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';
class HouseInvitationRequestDto {
}
exports.HouseInvitationRequestDto = HouseInvitationRequestDto;
__decorate([
    (0, swagger_2.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID дома обязателен' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], HouseInvitationRequestDto.prototype, "houseId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'guest@example.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Некорректный формат email' }),
    __metadata("design:type", String)
], HouseInvitationRequestDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        format: 'uuid',
        description: 'Роль участника в этом доме после принятия приглашения. Не используйте вместе с permissions.',
        example: UUID_EX,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], HouseInvitationRequestDto.prototype, "roleId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.HousePermission,
        isArray: true,
        description: 'Явный набор доменных прав (INVITE_MEMBERS, EDIT_ROLES, …). После принятия будет создана одна кастомная роль. Не используйте вместе с roleId.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.HousePermission, { each: true }),
    __metadata("design:type", Array)
], HouseInvitationRequestDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, format: 'date-time', description: 'Срок действия приглашения' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], HouseInvitationRequestDto.prototype, "expiresAt", void 0);
