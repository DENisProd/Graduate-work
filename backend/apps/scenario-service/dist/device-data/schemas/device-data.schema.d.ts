import { z } from 'zod';
export declare const createDeviceDataSchema: any;
export type CreateDeviceDataInput = z.infer<typeof createDeviceDataSchema>;
export declare const listDeviceDataQuerySchema: any;
export type ListDeviceDataQuery = z.infer<typeof listDeviceDataQuerySchema>;
