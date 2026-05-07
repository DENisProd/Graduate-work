"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = void 0;
exports.skipTake = skipTake;
const zod_1 = require("zod");
const coerceOptionalInt = (opts) => zod_1.z
    .preprocess((v) => {
    if (v === '' || v === null || v === undefined)
        return undefined;
    const n = typeof v === 'number'
        ? v
        : typeof v === 'string' && v.trim() !== ''
            ? Number(v)
            : NaN;
    if (!Number.isFinite(n))
        return v;
    let int = Math.trunc(n);
    int = Math.max(opts.min, int);
    if (opts.max !== undefined)
        int = Math.min(opts.max, int);
    return int;
}, zod_1.z.number().int().min(opts.min).optional())
    .default(opts.defaultValue);
exports.paginationQuerySchema = zod_1.z.object({
    page: coerceOptionalInt({ min: 1, defaultValue: 1 }),
    limit: coerceOptionalInt({ min: 1, max: 100, defaultValue: 20 }),
});
function skipTake(p) {
    const page = Number.isFinite(p.page) ? Math.max(1, Math.trunc(p.page)) : 1;
    const limit = Number.isFinite(p.limit)
        ? Math.min(100, Math.max(1, Math.trunc(p.limit)))
        : 20;
    return {
        skip: Math.max(0, (page - 1) * limit),
        take: limit,
    };
}
//# sourceMappingURL=pagination.js.map