"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateScenarioDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const scenario_schema_1 = require("../schemas/scenario.schema");
class CreateScenarioDto extends (0, nestjs_zod_1.createZodDto)(scenario_schema_1.createScenarioSchema) {
}
exports.CreateScenarioDto = CreateScenarioDto;
//# sourceMappingURL=create-scenario.dto.js.map