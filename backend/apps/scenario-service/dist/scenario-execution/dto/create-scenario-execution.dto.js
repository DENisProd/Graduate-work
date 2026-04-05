"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateScenarioExecutionDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const scenario_execution_schema_1 = require("../schemas/scenario-execution.schema");
class CreateScenarioExecutionDto extends (0, nestjs_zod_1.createZodDto)(scenario_execution_schema_1.createScenarioExecutionSchema) {
}
exports.CreateScenarioExecutionDto = CreateScenarioExecutionDto;
//# sourceMappingURL=create-scenario-execution.dto.js.map