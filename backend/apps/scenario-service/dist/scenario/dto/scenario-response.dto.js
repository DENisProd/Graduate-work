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
exports.ScenarioListResponseDto = exports.ScenarioResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../common/schemas/enums");
const scenario_definition_schema_1 = require("../schemas/scenario-definition.schema");
class ScenarioResponseDto {
    id;
    name;
    description;
    houseId;
    definition;
    createdAt;
    updatedAt;
    status;
    creatorId;
}
exports.ScenarioResponseDto = ScenarioResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], ScenarioResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioResponseDto.prototype, "houseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Object,
        description: 'Универсальное определение сценария (scope/triggers/conditions/actions/options)',
        example: scenario_definition_schema_1.scenarioDefinitionExampleHome,
    }),
    __metadata("design:type", Object)
], ScenarioResponseDto.prototype, "definition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ScenarioResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ScenarioResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.ScenarioStatus }),
    __metadata("design:type", String)
], ScenarioResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioResponseDto.prototype, "creatorId", void 0);
class ScenarioListResponseDto {
    items;
    total;
}
exports.ScenarioListResponseDto = ScenarioListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ScenarioResponseDto] }),
    __metadata("design:type", Array)
], ScenarioListResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ScenarioListResponseDto.prototype, "total", void 0);
//# sourceMappingURL=scenario-response.dto.js.map