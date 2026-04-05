"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioExecutionModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const scenario_execution_controller_1 = require("./scenario-execution.controller");
const scenario_execution_service_1 = require("./scenario-execution.service");
const scenario_execution_repository_1 = require("./scenario-execution.repository");
const scenario_execution_mongo_1 = require("../mongo/schemas/scenario-execution.mongo");
let ScenarioExecutionModule = class ScenarioExecutionModule {
};
exports.ScenarioExecutionModule = ScenarioExecutionModule;
exports.ScenarioExecutionModule = ScenarioExecutionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: scenario_execution_mongo_1.SCENARIO_EXECUTION_MODEL, schema: scenario_execution_mongo_1.ScenarioExecutionSchema },
            ]),
        ],
        controllers: [scenario_execution_controller_1.ScenarioExecutionController],
        providers: [scenario_execution_service_1.ScenarioExecutionService, scenario_execution_repository_1.ScenarioExecutionRepository],
        exports: [scenario_execution_service_1.ScenarioExecutionService],
    })
], ScenarioExecutionModule);
//# sourceMappingURL=scenario-execution.module.js.map