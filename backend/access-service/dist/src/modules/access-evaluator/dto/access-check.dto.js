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
exports.AccessCheckDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AccessCheckDto {
}
exports.AccessCheckDto = AccessCheckDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Внешний ID пользователя (externalUserId)' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AccessCheckDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', description: 'ID ресурса' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AccessCheckDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['READ', 'WRITE'], description: 'Операция' }),
    (0, class_validator_1.IsIn)(['READ', 'WRITE']),
    __metadata("design:type", String)
], AccessCheckDto.prototype, "action", void 0);
