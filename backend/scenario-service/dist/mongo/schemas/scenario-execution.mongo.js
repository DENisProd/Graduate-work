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
exports.ScenarioExecutionSchema = exports.ScenarioExecutionModel = exports.SCENARIO_EXECUTION_MODEL = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const enums_1 = require("../../common/schemas/enums");
exports.SCENARIO_EXECUTION_MODEL = 'ScenarioExecution';
let ScenarioExecutionModel = class ScenarioExecutionModel {
    scenarioId;
    status;
    triggeredBy;
    triggerData;
    errorMessage;
    startedAt;
    endedAt;
};
exports.ScenarioExecutionModel = ScenarioExecutionModel;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ScenarioExecutionModel.prototype, "scenarioId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: Object.values(enums_1.ScenarioExecutionStatus) }),
    __metadata("design:type", String)
], ScenarioExecutionModel.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(enums_1.TriggerSourceType),
    }),
    __metadata("design:type", String)
], ScenarioExecutionModel.prototype, "triggeredBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Object }),
    __metadata("design:type", Object)
], ScenarioExecutionModel.prototype, "triggerData", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], ScenarioExecutionModel.prototype, "errorMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], ScenarioExecutionModel.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], ScenarioExecutionModel.prototype, "endedAt", void 0);
exports.ScenarioExecutionModel = ScenarioExecutionModel = __decorate([
    (0, mongoose_1.Schema)({ collection: 'ScenarioExecution' })
], ScenarioExecutionModel);
exports.ScenarioExecutionSchema = mongoose_1.SchemaFactory.createForClass(ScenarioExecutionModel);
//# sourceMappingURL=scenario-execution.mongo.js.map