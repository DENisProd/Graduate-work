"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listScenariosQuerySchema = exports.updateScenarioSchema = exports.createScenarioSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../common/schemas/enums");
const enums_2 = require("../../common/schemas/enums");
const scenario_definition_schema_1 = require("./scenario-definition.schema");
const pagination_1 = require("../../common/schemas/pagination");
exports.createScenarioSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().max(2000).optional(),
    status: enums_1.scenarioStatusSchema.default(enums_2.ScenarioStatus.OFFLINE),
    creatorId: zod_1.z.string().min(1).max(255),
    houseId: zod_1.z.string().min(1).max(255),
    definition: scenario_definition_schema_1.scenarioDefinitionSchema,
});
exports.updateScenarioSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).optional(),
    description: zod_1.z.string().max(2000).optional().nullable(),
    status: enums_1.scenarioStatusSchema.optional(),
    definition: scenario_definition_schema_1.scenarioDefinitionSchema.optional(),
});
const listScenariosQuerySchemaBase = zod_1.z.object({
    houseId: zod_1.z.string().min(1).max(255).optional(),
    status: enums_1.scenarioStatusSchema.optional(),
    creatorId: zod_1.z.string().optional(),
});
exports.listScenariosQuerySchema = listScenariosQuerySchemaBase.merge(pagination_1.paginationQuerySchema);
//# sourceMappingURL=scenario.schema.js.map