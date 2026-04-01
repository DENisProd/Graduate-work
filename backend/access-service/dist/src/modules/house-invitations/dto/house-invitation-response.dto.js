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
exports.HouseInvitationResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';
class HouseInvitationResponseDto {
}
exports.HouseInvitationResponseDto = HouseInvitationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "houseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Мой дом' }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "houseName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'guest@example.com' }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a1b2c3d4-token' }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED'] }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01 12:00:00' }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-01 12:00:00' }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "acceptedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-01 12:00:00' }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "invitedById", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid', description: 'Выбранная роль при создании приглашения' }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "roleId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Имя роли, если указан roleId' }),
    __metadata("design:type", String)
], HouseInvitationResponseDto.prototype, "roleName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.HousePermission, isArray: true, description: 'Права: у выбранной роли или явный список до принятия' }),
    __metadata("design:type", Array)
], HouseInvitationResponseDto.prototype, "permissions", void 0);
