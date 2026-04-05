"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.objectIdSchema = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
exports.objectIdSchema = zod_1.z
    .string()
    .regex(objectIdRegex, 'Invalid ObjectId');
exports.idParamSchema = zod_1.z.object({
    id: exports.objectIdSchema,
});
//# sourceMappingURL=id-params.js.map