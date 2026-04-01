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
exports.HouseMemberDetailResponseDto = exports.HouseMemberResponseDto = exports.HouseMemberListItemDto = exports.MemberEffectivePermissionDto = exports.HouseMemberRoleBriefDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const house_access_right_response_dto_1 = require("../../access-control/dto/house-access-right-response.dto");
const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';
class HouseMemberRoleBriefDto {
}
exports.HouseMemberRoleBriefDto = HouseMemberRoleBriefDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], HouseMemberRoleBriefDto.prototype, "memberRoleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], HouseMemberRoleBriefDto.prototype, "roleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Админ' }),
    __metadata("design:type", String)
], HouseMemberRoleBriefDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], HouseMemberRoleBriefDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], HouseMemberRoleBriefDto.prototype, "isSystem", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        enum: ['INVITE_MEMBERS', 'EDIT_ROLES', 'MANAGE_DEVICES', 'MANAGE_AUTOMATIONS'],
    }),
    __metadata("design:type", Array)
], HouseMemberRoleBriefDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01 12:00:00' }),
    __metadata("design:type", String)
], HouseMemberRoleBriefDto.prototype, "assignedAt", void 0);
class MemberEffectivePermissionDto {
}
exports.MemberEffectivePermissionDto = MemberEffectivePermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], MemberEffectivePermissionDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['HOUSE', 'ROOM', 'DEVICE', 'DEVICE_FUNCTION', 'SCENE', 'GROUP', 'AUTOMATION'],
    }),
    __metadata("design:type", String)
], MemberEffectivePermissionDto.prototype, "resourceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MemberEffectivePermissionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MemberEffectivePermissionDto.prototype, "externalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '/house/...' }),
    __metadata("design:type", String)
], MemberEffectivePermissionDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ALLOW', 'DENY', 'READ', 'WRITE'] }),
    __metadata("design:type", String)
], MemberEffectivePermissionDto.prototype, "accessRightType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ROLE', 'DIRECT', 'POLICY'] }),
    __metadata("design:type", String)
], MemberEffectivePermissionDto.prototype, "sourceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    __metadata("design:type", String)
], MemberEffectivePermissionDto.prototype, "sourceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-01 12:00:00' }),
    __metadata("design:type", String)
], MemberEffectivePermissionDto.prototype, "expiresAt", void 0);
class HouseMemberListItemDto {
}
exports.HouseMemberListItemDto = HouseMemberListItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], HouseMemberListItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
    __metadata("design:type", String)
], HouseMemberListItemDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://cdn.example/avatar.png' }),
    __metadata("design:type", String)
], HouseMemberListItemDto.prototype, "userAvatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01 12:00:00' }),
    __metadata("design:type", String)
], HouseMemberListItemDto.prototype, "joinedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [HouseMemberRoleBriefDto], description: 'Назначенные роли участника в доме' }),
    __metadata("design:type", Array)
], HouseMemberListItemDto.prototype, "roles", void 0);
class HouseMemberResponseDto {
}
exports.HouseMemberResponseDto = HouseMemberResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], HouseMemberResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
    __metadata("design:type", String)
], HouseMemberResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://cdn.example/avatar.png' }),
    __metadata("design:type", String)
], HouseMemberResponseDto.prototype, "userAvatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], HouseMemberResponseDto.prototype, "houseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Мой дом' }),
    __metadata("design:type", String)
], HouseMemberResponseDto.prototype, "houseName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01 12:00:00' }),
    __metadata("design:type", String)
], HouseMemberResponseDto.prototype, "joinedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [HouseMemberRoleBriefDto], description: 'Назначенные роли участника в доме' }),
    __metadata("design:type", Array)
], HouseMemberResponseDto.prototype, "roles", void 0);
class HouseMemberDetailResponseDto extends HouseMemberResponseDto {
}
exports.HouseMemberDetailResponseDto = HouseMemberDetailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [MemberEffectivePermissionDto],
        description: 'Итоговые права по ресурсам (кэш effective permissions)',
    }),
    __metadata("design:type", Array)
], HouseMemberDetailResponseDto.prototype, "effectivePermissions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [house_access_right_response_dto_1.HouseAccessRightResponseDto],
        description: 'Прямые права участника (не через роль)',
    }),
    __metadata("design:type", Array)
], HouseMemberDetailResponseDto.prototype, "directAccessRights", void 0);
