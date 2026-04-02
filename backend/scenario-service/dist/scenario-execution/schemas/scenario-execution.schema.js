"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listScenarioExecutionsQuerySchema = exports.updateScenarioExecutionSchema = exports.createScenarioExecutionSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../common/schemas/enums");
const enums_2 = require("../../common/schemas/enums");
const pagination_1 = require("../../common/schemas/pagination");
exports.createScenarioExecutionSchema = zod_1.z.object({
    scenarioId: zod_1.z.string().min(1),
    status: enums_1.scenarioExecutionStatusSchema.default(enums_2.ScenarioExecutionStatus.RUNNING),
    triggeredBy: enums_1.triggerSourceTypeSchema,
    triggerData: zod_1.z.record(zod_1.z.unknown()),
    errorMessage: zod_1.z.string().max(2000).optional(),
});
exports.updateScenarioExecutionSchema = zod_1.z.object({
    status: enums_1.scenarioExecutionStatusSchema.optional(),
    errorMessage: zod_1.z.string().max(2000).optional().nullable(),
    endedAt: zod_1.z.coerce.date().optional().nullable(),
});
const listScenarioExecutionsQuerySchemaBase = zod_1.z.object({
    scenarioId: zod_1.z.string().min(1).optional(),
    status: enums_1.scenarioExecutionStatusSchema.optional(),
    triggeredBy: enums_1.triggerSourceTypeSchema.optional(),
});
exports.listScenarioExecutionsQuerySchema = listScenarioExecutionsQuerySchemaBase.merge(pagination_1.paginationQuerySchema);
//# sourceMappingURL=scenario-execution.schema.js.map