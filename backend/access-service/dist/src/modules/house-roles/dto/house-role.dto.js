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
exports.HouseRoleResponseDto = exports.CreateHouseRoleRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateHouseRoleRequestDto {
}
exports.CreateHouseRoleRequestDto = CreateHouseRoleRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Гость' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHouseRoleRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, description: 'Приоритет (меньше = выше в иерархии). Для кастомных ролей обычно > 3' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateHouseRoleRequestDto.prototype, "priority", void 0);
const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';
class HouseRoleResponseDto {
}
exports.HouseRoleResponseDto = HouseRoleResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], HouseRoleResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HouseRoleResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], HouseRoleResponseDto.prototype, "houseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], HouseRoleResponseDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], HouseRoleResponseDto.prototype, "isSystem", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], enum: ['INVITE_MEMBERS', 'EDIT_ROLES', 'MANAGE_DEVICES', 'MANAGE_AUTOMATIONS'] }),
    __metadata("design:type", Array)
], HouseRoleResponseDto.prototype, "permissions", void 0);
