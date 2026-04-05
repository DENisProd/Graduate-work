import { z } from 'zod';
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: unknown;
    limit?: unknown;
}>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export declare function skipTake(p: PaginationQuery): {
    skip: number;
    take: number;
};
