import { z } from 'zod';
export declare const objectIdSchema: z.ZodString;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type IdParam = z.infer<typeof idParamSchema>;
