import { z } from 'zod';
export declare const objectIdSchema: any;
export declare const idParamSchema: any;
export type IdParam = z.infer<typeof idParamSchema>;
