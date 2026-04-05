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
exports.ScenarioExecutionListResponseDto = exports.ScenarioExecutionResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../common/schemas/enums");
class ScenarioExecutionResponseDto {
    id;
    scenarioId;
    status;
    triggeredBy;
    triggerData;
    errorMessage;
    startedAt;
    endedAt;
}
exports.ScenarioExecutionResponseDto = ScenarioExecutionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioExecutionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioExecutionResponseDto.prototype, "scenarioId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.ScenarioExecutionStatus }),
    __metadata("design:type", String)
], ScenarioExecutionResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.TriggerSourceType }),
    __metadata("design:type", String)
], ScenarioExecutionResponseDto.prototype, "triggeredBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: Object }),
    __metadata("design:type", Object)
], ScenarioExecutionResponseDto.prototype, "triggerData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], ScenarioExecutionResponseDto.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ScenarioExecutionResponseDto.prototype, "startedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], ScenarioExecutionResponseDto.prototype, "endedAt", void 0);
class ScenarioExecutionListResponseDto {
    items;
    total;
}
exports.ScenarioExecutionListResponseDto = ScenarioExecutionListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ScenarioExecutionResponseDto] }),
    __metadata("design:type", Array)
], ScenarioExecutionListResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ScenarioExecutionListResponseDto.prototype, "total", void 0);
//# sourceMappingURL=scenario-execution-response.dto.js.map