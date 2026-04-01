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
exports.CreatePolicyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreatePolicyDto {
}
exports.CreatePolicyDto = CreatePolicyDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePolicyDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AccessRightType }),
    (0, class_validator_1.IsEnum)(client_1.AccessRightType),
    __metadata("design:type", String)
], CreatePolicyDto.prototype, "effect", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PolicySubjectType }),
    (0, class_validator_1.IsEnum)(client_1.PolicySubjectType),
    __metadata("design:type", String)
], CreatePolicyDto.prototype, "subjectType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID субъекта (user/role/member) в зависимости от subjectType' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePolicyDto.prototype, "subjectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', description: 'Ресурс, к которому применяется политика' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePolicyDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Произвольные условия в виде JSON' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreatePolicyDto.prototype, "condition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Чем меньше число, тем выше приоритет', default: 100 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePolicyDto.prototype, "priority", void 0);
