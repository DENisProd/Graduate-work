import { z } from 'zod';
export declare const createScenarioSchema: any;
export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;
export declare const updateScenarioSchema: any;
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>;
export declare const listScenariosQuerySchema: any;
export type ListScenariosQuery = z.infer<typeof listScenariosQuerySchema>;
