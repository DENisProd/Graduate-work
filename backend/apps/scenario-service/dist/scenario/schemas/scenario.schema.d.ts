import { z } from 'zod';
import { ScenarioStatus } from '../../common/schemas/enums';
export declare const createScenarioSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof ScenarioStatus>>;
    creatorId: z.ZodString;
    houseId: z.ZodString;
    definition: z.ZodObject<{
        version: z.ZodLiteral<1>;
        scope: z.ZodObject<{
            kind: z.ZodDefault<z.ZodEnum<["HOUSE", "OFFICE"]>>;
            spaceId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "HOUSE" | "OFFICE";
            spaceId: string;
        }, {
            spaceId: string;
            kind?: "HOUSE" | "OFFICE" | undefined;
        }>;
        triggers: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"SCHEDULE">;
            cron: z.ZodString;
            timezone: z.ZodOptional<z.ZodString>;
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            type: "SCHEDULE";
            cron: string;
            enabled: boolean;
            timezone?: string | undefined;
        }, {
            type: "SCHEDULE";
            cron: string;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"MANUAL">;
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            type: "MANUAL";
            enabled: boolean;
        }, {
            type: "MANUAL";
            enabled?: boolean | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"DEVICE_EVENT">;
            deviceId: z.ZodString;
            event: z.ZodString;
            payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<unknown, z.ZodTypeDef, unknown>>>;
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            type: "DEVICE_EVENT";
            deviceId: string;
            enabled: boolean;
            event: string;
            payload?: Record<string, unknown> | undefined;
        }, {
            type: "DEVICE_EVENT";
            deviceId: string;
            event: string;
            payload?: Record<string, unknown> | undefined;
            enabled?: boolean | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"WEBHOOK">;
            token: z.ZodString;
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            type: "WEBHOOK";
            enabled: boolean;
            token: string;
        }, {
            type: "WEBHOOK";
            token: string;
            enabled?: boolean | undefined;
        }>]>, "many">;
        conditions: any;
        actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"DEVICE_COMMAND">;
            deviceId: z.ZodString;
            command: z.ZodString;
            args: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<unknown, z.ZodTypeDef, unknown>>>;
        }, "strip", z.ZodTypeAny, {
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        }, {
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"DELAY">;
            ms: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "DELAY";
            ms: number;
        }, {
            type: "DELAY";
            ms: number;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"NOTIFY">;
            channel: z.ZodDefault<z.ZodEnum<["PUSH", "EMAIL", "TELEGRAM", "WEB"]>>;
            title: z.ZodOptional<z.ZodString>;
            message: z.ZodString;
            data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<unknown, z.ZodTypeDef, unknown>>>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            type: "NOTIFY";
            channel: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB";
            title?: string | undefined;
            data?: Record<string, unknown> | undefined;
        }, {
            message: string;
            type: "NOTIFY";
            title?: string | undefined;
            channel?: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB" | undefined;
            data?: Record<string, unknown> | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"HTTP_REQUEST">;
            method: z.ZodDefault<z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>>;
            url: z.ZodString;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            body: z.ZodOptional<z.ZodType<unknown, z.ZodTypeDef, unknown>>;
            timeoutMs: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "HTTP_REQUEST";
            method: "POST" | "DELETE" | "GET" | "PUT" | "PATCH";
            url: string;
            timeoutMs: number;
            headers?: Record<string, string> | undefined;
            body?: unknown;
        }, {
            type: "HTTP_REQUEST";
            url: string;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "DELETE" | "GET" | "PUT" | "PATCH" | undefined;
            body?: unknown;
            timeoutMs?: number | undefined;
        }>]>, "many">;
        options: z.ZodOptional<z.ZodObject<{
            timezone: z.ZodOptional<z.ZodString>;
            debounceMs: z.ZodOptional<z.ZodNumber>;
            maxConcurrency: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        }, {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        version: 1;
        scope: {
            kind: "HOUSE" | "OFFICE";
            spaceId: string;
        };
        triggers: ({
            type: "SCHEDULE";
            cron: string;
            enabled: boolean;
            timezone?: string | undefined;
        } | {
            type: "MANUAL";
            enabled: boolean;
        } | {
            type: "DEVICE_EVENT";
            deviceId: string;
            enabled: boolean;
            event: string;
            payload?: Record<string, unknown> | undefined;
        } | {
            type: "WEBHOOK";
            enabled: boolean;
            token: string;
        })[];
        actions: ({
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        } | {
            type: "DELAY";
            ms: number;
        } | {
            message: string;
            type: "NOTIFY";
            channel: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB";
            title?: string | undefined;
            data?: Record<string, unknown> | undefined;
        } | {
            type: "HTTP_REQUEST";
            method: "POST" | "DELETE" | "GET" | "PUT" | "PATCH";
            url: string;
            timeoutMs: number;
            headers?: Record<string, string> | undefined;
            body?: unknown;
        })[];
        options?: {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        } | undefined;
        conditions?: any;
    }, {
        version: 1;
        scope: {
            spaceId: string;
            kind?: "HOUSE" | "OFFICE" | undefined;
        };
        triggers: ({
            type: "SCHEDULE";
            cron: string;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        } | {
            type: "MANUAL";
            enabled?: boolean | undefined;
        } | {
            type: "DEVICE_EVENT";
            deviceId: string;
            event: string;
            payload?: Record<string, unknown> | undefined;
            enabled?: boolean | undefined;
        } | {
            type: "WEBHOOK";
            token: string;
            enabled?: boolean | undefined;
        })[];
        actions: ({
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        } | {
            type: "DELAY";
            ms: number;
        } | {
            message: string;
            type: "NOTIFY";
            title?: string | undefined;
            channel?: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB" | undefined;
            data?: Record<string, unknown> | undefined;
        } | {
            type: "HTTP_REQUEST";
            url: string;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "DELETE" | "GET" | "PUT" | "PATCH" | undefined;
            body?: unknown;
            timeoutMs?: number | undefined;
        })[];
        options?: {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        } | undefined;
        conditions?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    status: ScenarioStatus;
    name: string;
    houseId: string;
    definition: {
        version: 1;
        scope: {
            kind: "HOUSE" | "OFFICE";
            spaceId: string;
        };
        triggers: ({
            type: "SCHEDULE";
            cron: string;
            enabled: boolean;
            timezone?: string | undefined;
        } | {
            type: "MANUAL";
            enabled: boolean;
        } | {
            type: "DEVICE_EVENT";
            deviceId: string;
            enabled: boolean;
            event: string;
            payload?: Record<string, unknown> | undefined;
        } | {
            type: "WEBHOOK";
            enabled: boolean;
            token: string;
        })[];
        actions: ({
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        } | {
            type: "DELAY";
            ms: number;
        } | {
            message: string;
            type: "NOTIFY";
            channel: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB";
            title?: string | undefined;
            data?: Record<string, unknown> | undefined;
        } | {
            type: "HTTP_REQUEST";
            method: "POST" | "DELETE" | "GET" | "PUT" | "PATCH";
            url: string;
            timeoutMs: number;
            headers?: Record<string, string> | undefined;
            body?: unknown;
        })[];
        options?: {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        } | undefined;
        conditions?: any;
    };
    creatorId: string;
    description?: string | undefined;
}, {
    name: string;
    houseId: string;
    definition: {
        version: 1;
        scope: {
            spaceId: string;
            kind?: "HOUSE" | "OFFICE" | undefined;
        };
        triggers: ({
            type: "SCHEDULE";
            cron: string;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        } | {
            type: "MANUAL";
            enabled?: boolean | undefined;
        } | {
            type: "DEVICE_EVENT";
            deviceId: string;
            event: string;
            payload?: Record<string, unknown> | undefined;
            enabled?: boolean | undefined;
        } | {
            type: "WEBHOOK";
            token: string;
            enabled?: boolean | undefined;
        })[];
        actions: ({
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        } | {
            type: "DELAY";
            ms: number;
        } | {
            message: string;
            type: "NOTIFY";
            title?: string | undefined;
            channel?: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB" | undefined;
            data?: Record<string, unknown> | undefined;
        } | {
            type: "HTTP_REQUEST";
            url: string;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "DELETE" | "GET" | "PUT" | "PATCH" | undefined;
            body?: unknown;
            timeoutMs?: number | undefined;
        })[];
        options?: {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        } | undefined;
        conditions?: any;
    };
    creatorId: string;
    description?: string | undefined;
    status?: ScenarioStatus | undefined;
}>;
export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;
export declare const updateScenarioSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof ScenarioStatus>>;
    definition: z.ZodOptional<z.ZodObject<{
        version: z.ZodLiteral<1>;
        scope: z.ZodObject<{
            kind: z.ZodDefault<z.ZodEnum<["HOUSE", "OFFICE"]>>;
            spaceId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "HOUSE" | "OFFICE";
            spaceId: string;
        }, {
            spaceId: string;
            kind?: "HOUSE" | "OFFICE" | undefined;
        }>;
        triggers: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"SCHEDULE">;
            cron: z.ZodString;
            timezone: z.ZodOptional<z.ZodString>;
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            type: "SCHEDULE";
            cron: string;
            enabled: boolean;
            timezone?: string | undefined;
        }, {
            type: "SCHEDULE";
            cron: string;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"MANUAL">;
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            type: "MANUAL";
            enabled: boolean;
        }, {
            type: "MANUAL";
            enabled?: boolean | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"DEVICE_EVENT">;
            deviceId: z.ZodString;
            event: z.ZodString;
            payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<unknown, z.ZodTypeDef, unknown>>>;
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            type: "DEVICE_EVENT";
            deviceId: string;
            enabled: boolean;
            event: string;
            payload?: Record<string, unknown> | undefined;
        }, {
            type: "DEVICE_EVENT";
            deviceId: string;
            event: string;
            payload?: Record<string, unknown> | undefined;
            enabled?: boolean | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"WEBHOOK">;
            token: z.ZodString;
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            type: "WEBHOOK";
            enabled: boolean;
            token: string;
        }, {
            type: "WEBHOOK";
            token: string;
            enabled?: boolean | undefined;
        }>]>, "many">;
        conditions: any;
        actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"DEVICE_COMMAND">;
            deviceId: z.ZodString;
            command: z.ZodString;
            args: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<unknown, z.ZodTypeDef, unknown>>>;
        }, "strip", z.ZodTypeAny, {
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        }, {
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"DELAY">;
            ms: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "DELAY";
            ms: number;
        }, {
            type: "DELAY";
            ms: number;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"NOTIFY">;
            channel: z.ZodDefault<z.ZodEnum<["PUSH", "EMAIL", "TELEGRAM", "WEB"]>>;
            title: z.ZodOptional<z.ZodString>;
            message: z.ZodString;
            data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<unknown, z.ZodTypeDef, unknown>>>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            type: "NOTIFY";
            channel: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB";
            title?: string | undefined;
            data?: Record<string, unknown> | undefined;
        }, {
            message: string;
            type: "NOTIFY";
            title?: string | undefined;
            channel?: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB" | undefined;
            data?: Record<string, unknown> | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"HTTP_REQUEST">;
            method: z.ZodDefault<z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>>;
            url: z.ZodString;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            body: z.ZodOptional<z.ZodType<unknown, z.ZodTypeDef, unknown>>;
            timeoutMs: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "HTTP_REQUEST";
            method: "POST" | "DELETE" | "GET" | "PUT" | "PATCH";
            url: string;
            timeoutMs: number;
            headers?: Record<string, string> | undefined;
            body?: unknown;
        }, {
            type: "HTTP_REQUEST";
            url: string;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "DELETE" | "GET" | "PUT" | "PATCH" | undefined;
            body?: unknown;
            timeoutMs?: number | undefined;
        }>]>, "many">;
        options: z.ZodOptional<z.ZodObject<{
            timezone: z.ZodOptional<z.ZodString>;
            debounceMs: z.ZodOptional<z.ZodNumber>;
            maxConcurrency: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        }, {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        version: 1;
        scope: {
            kind: "HOUSE" | "OFFICE";
            spaceId: string;
        };
        triggers: ({
            type: "SCHEDULE";
            cron: string;
            enabled: boolean;
            timezone?: string | undefined;
        } | {
            type: "MANUAL";
            enabled: boolean;
        } | {
            type: "DEVICE_EVENT";
            deviceId: string;
            enabled: boolean;
            event: string;
            payload?: Record<string, unknown> | undefined;
        } | {
            type: "WEBHOOK";
            enabled: boolean;
            token: string;
        })[];
        actions: ({
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        } | {
            type: "DELAY";
            ms: number;
        } | {
            message: string;
            type: "NOTIFY";
            channel: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB";
            title?: string | undefined;
            data?: Record<string, unknown> | undefined;
        } | {
            type: "HTTP_REQUEST";
            method: "POST" | "DELETE" | "GET" | "PUT" | "PATCH";
            url: string;
            timeoutMs: number;
            headers?: Record<string, string> | undefined;
            body?: unknown;
        })[];
        options?: {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        } | undefined;
        conditions?: any;
    }, {
        version: 1;
        scope: {
            spaceId: string;
            kind?: "HOUSE" | "OFFICE" | undefined;
        };
        triggers: ({
            type: "SCHEDULE";
            cron: string;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        } | {
            type: "MANUAL";
            enabled?: boolean | undefined;
        } | {
            type: "DEVICE_EVENT";
            deviceId: string;
            event: string;
            payload?: Record<string, unknown> | undefined;
            enabled?: boolean | undefined;
        } | {
            type: "WEBHOOK";
            token: string;
            enabled?: boolean | undefined;
        })[];
        actions: ({
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        } | {
            type: "DELAY";
            ms: number;
        } | {
            message: string;
            type: "NOTIFY";
            title?: string | undefined;
            channel?: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB" | undefined;
            data?: Record<string, unknown> | undefined;
        } | {
            type: "HTTP_REQUEST";
            url: string;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "DELETE" | "GET" | "PUT" | "PATCH" | undefined;
            body?: unknown;
            timeoutMs?: number | undefined;
        })[];
        options?: {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        } | undefined;
        conditions?: any;
    }>>;
}, "strip", z.ZodTypeAny, {
    description?: string | null | undefined;
    status?: ScenarioStatus | undefined;
    name?: string | undefined;
    definition?: {
        version: 1;
        scope: {
            kind: "HOUSE" | "OFFICE";
            spaceId: string;
        };
        triggers: ({
            type: "SCHEDULE";
            cron: string;
            enabled: boolean;
            timezone?: string | undefined;
        } | {
            type: "MANUAL";
            enabled: boolean;
        } | {
            type: "DEVICE_EVENT";
            deviceId: string;
            enabled: boolean;
            event: string;
            payload?: Record<string, unknown> | undefined;
        } | {
            type: "WEBHOOK";
            enabled: boolean;
            token: string;
        })[];
        actions: ({
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        } | {
            type: "DELAY";
            ms: number;
        } | {
            message: string;
            type: "NOTIFY";
            channel: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB";
            title?: string | undefined;
            data?: Record<string, unknown> | undefined;
        } | {
            type: "HTTP_REQUEST";
            method: "POST" | "DELETE" | "GET" | "PUT" | "PATCH";
            url: string;
            timeoutMs: number;
            headers?: Record<string, string> | undefined;
            body?: unknown;
        })[];
        options?: {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        } | undefined;
        conditions?: any;
    } | undefined;
}, {
    description?: string | null | undefined;
    status?: ScenarioStatus | undefined;
    name?: string | undefined;
    definition?: {
        version: 1;
        scope: {
            spaceId: string;
            kind?: "HOUSE" | "OFFICE" | undefined;
        };
        triggers: ({
            type: "SCHEDULE";
            cron: string;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        } | {
            type: "MANUAL";
            enabled?: boolean | undefined;
        } | {
            type: "DEVICE_EVENT";
            deviceId: string;
            event: string;
            payload?: Record<string, unknown> | undefined;
            enabled?: boolean | undefined;
        } | {
            type: "WEBHOOK";
            token: string;
            enabled?: boolean | undefined;
        })[];
        actions: ({
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        } | {
            type: "DELAY";
            ms: number;
        } | {
            message: string;
            type: "NOTIFY";
            title?: string | undefined;
            channel?: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB" | undefined;
            data?: Record<string, unknown> | undefined;
        } | {
            type: "HTTP_REQUEST";
            url: string;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "DELETE" | "GET" | "PUT" | "PATCH" | undefined;
            body?: unknown;
            timeoutMs?: number | undefined;
        })[];
        options?: {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        } | undefined;
        conditions?: any;
    } | undefined;
}>;
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>;
export declare const listScenariosQuerySchema: z.ZodObject<{
    houseId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof ScenarioStatus>>;
    creatorId: z.ZodOptional<z.ZodString>;
} & {
    page: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: ScenarioStatus | undefined;
    houseId?: string | undefined;
    creatorId?: string | undefined;
}, {
    status?: ScenarioStatus | undefined;
    page?: unknown;
    limit?: unknown;
    houseId?: string | undefined;
    creatorId?: string | undefined;
}>;
export type ListScenariosQuery = z.infer<typeof listScenariosQuerySchema>;
