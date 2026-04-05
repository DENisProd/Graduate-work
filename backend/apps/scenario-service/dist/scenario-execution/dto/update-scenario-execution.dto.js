"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateScenarioExecutionDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const scenario_execution_schema_1 = require("../schemas/scenario-execution.schema");
class UpdateScenarioExecutionDto extends (0, nestjs_zod_1.createZodDto)(scenario_execution_schema_1.updateScenarioExecutionSchema) {
}
exports.UpdateScenarioExecutionDto = UpdateScenarioExecutionDto;
//# sourceMappingURL=update-scenario-execution.dto.js.map