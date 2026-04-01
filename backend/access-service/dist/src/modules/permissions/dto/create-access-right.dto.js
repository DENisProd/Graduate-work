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
exports.CreateAccessRightDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateAccessRightDto {
}
exports.CreateAccessRightDto = CreateAccessRightDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid', description: 'ID участника дома' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "houseMemberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid', description: 'ID роли дома' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "roleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AccessRightType }),
    (0, class_validator_1.IsEnum)(client_1.AccessRightType),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "accessRightType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Дата истечения в ISO-формате' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreateAccessRightDto.prototype, "expiresAt", void 0);
