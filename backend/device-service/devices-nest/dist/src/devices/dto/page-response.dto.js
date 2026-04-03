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
exports.PageResponse = void 0;
const swagger_1 = require("@nestjs/swagger");
class PageResponse {
    constructor(init) {
        Object.assign(this, init);
    }
}
exports.PageResponse = PageResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Элементы текущей страницы', type: 'array', items: { type: 'object' } }),
    __metadata("design:type", Array)
], PageResponse.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    __metadata("design:type", Number)
], PageResponse.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20 }),
    __metadata("design:type", Number)
], PageResponse.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Всего элементов по фильтру' }),
    __metadata("design:type", Number)
], PageResponse.prototype, "totalElements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PageResponse.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], PageResponse.prototype, "first", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], PageResponse.prototype, "last", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], PageResponse.prototype, "hasNext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], PageResponse.prototype, "hasPrevious", void 0);
