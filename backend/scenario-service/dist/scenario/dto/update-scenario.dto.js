"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateScenarioDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const scenario_schema_1 = require("../schemas/scenario.schema");
class UpdateScenarioDto extends (0, nestjs_zod_1.createZodDto)(scenario_schema_1.updateScenarioSchema) {
}
exports.UpdateScenarioDto = UpdateScenarioDto;
//# sourceMappingURL=update-scenario.dto.js.map