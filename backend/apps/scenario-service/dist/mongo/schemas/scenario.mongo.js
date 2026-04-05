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
exports.ScenarioSchema = exports.ScenarioModel = exports.SCENARIO_MODEL = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const enums_1 = require("../../common/schemas/enums");
exports.SCENARIO_MODEL = 'Scenario';
let ScenarioModel = class ScenarioModel {
    name;
    description;
    houseId;
    definition;
    status;
    creatorId;
    createdAt;
    updatedAt;
};
exports.ScenarioModel = ScenarioModel;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ScenarioModel.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], ScenarioModel.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String }),
    __metadata("design:type", String)
], ScenarioModel.prototype, "houseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Object }),
    __metadata("design:type", Object)
], ScenarioModel.prototype, "definition", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: Object.values(enums_1.ScenarioStatus) }),
    __metadata("design:type", String)
], ScenarioModel.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ScenarioModel.prototype, "creatorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], ScenarioModel.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], ScenarioModel.prototype, "updatedAt", void 0);
exports.ScenarioModel = ScenarioModel = __decorate([
    (0, mongoose_1.Schema)({ collection: 'Scenario' })
], ScenarioModel);
exports.ScenarioSchema = mongoose_1.SchemaFactory.createForClass(ScenarioModel);
//# sourceMappingURL=scenario.mongo.js.map