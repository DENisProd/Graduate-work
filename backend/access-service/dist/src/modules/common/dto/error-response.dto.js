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
exports.ErrorResponse = exports.FieldErrorDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class FieldErrorDto {
}
exports.FieldErrorDto = FieldErrorDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FieldErrorDto.prototype, "field", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FieldErrorDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Отклонённое значение' }),
    __metadata("design:type", Object)
], FieldErrorDto.prototype, "rejectedValue", void 0);
class ErrorResponse {
}
exports.ErrorResponse = ErrorResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01T12:00:00.000Z' }),
    __metadata("design:type", String)
], ErrorResponse.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 404 }),
    __metadata("design:type", Number)
], ErrorResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Not Found' }),
    __metadata("design:type", String)
], ErrorResponse.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Сообщение для клиента' }),
    __metadata("design:type", String)
], ErrorResponse.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '/api/v1/houses/…' }),
    __metadata("design:type", String)
], ErrorResponse.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [FieldErrorDto], description: 'Ошибки валидации полей' }),
    __metadata("design:type", Array)
], ErrorResponse.prototype, "fieldErrors", void 0);
