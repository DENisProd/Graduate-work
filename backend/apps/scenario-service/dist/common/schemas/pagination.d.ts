import { z } from 'zod';
export declare const paginationQuerySchema: any;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export declare function skipTake(p: PaginationQuery): {
    skip: number;
    take: number;
};
