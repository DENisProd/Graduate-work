declare const UpdateScenarioDto_base: import("nestjs-zod").ZodDto<{
    description?: string | null | undefined;
    status?: import("../../common/schemas").ScenarioStatus | undefined;
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
}, import("zod").ZodObjectDef<{
    name: import("zod").ZodOptional<import("zod").ZodString>;
    description: import("zod").ZodNullable<import("zod").ZodOptional<import("zod").ZodString>>;
    status: import("zod").ZodOptional<import("zod").ZodNativeEnum<typeof import("../../common/schemas").ScenarioStatus>>;
    definition: import("zod").ZodOptional<import("zod").ZodObject<{
        version: import("zod").ZodLiteral<1>;
        scope: import("zod").ZodObject<{
            kind: import("zod").ZodDefault<import("zod").ZodEnum<["HOUSE", "OFFICE"]>>;
            spaceId: import("zod").ZodString;
        }, "strip", import("zod").ZodTypeAny, {
            kind: "HOUSE" | "OFFICE";
            spaceId: string;
        }, {
            spaceId: string;
            kind?: "HOUSE" | "OFFICE" | undefined;
        }>;
        triggers: import("zod").ZodArray<import("zod").ZodDiscriminatedUnion<"type", [import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"SCHEDULE">;
            cron: import("zod").ZodString;
            timezone: import("zod").ZodOptional<import("zod").ZodString>;
            enabled: import("zod").ZodDefault<import("zod").ZodBoolean>;
        }, "strip", import("zod").ZodTypeAny, {
            type: "SCHEDULE";
            cron: string;
            enabled: boolean;
            timezone?: string | undefined;
        }, {
            type: "SCHEDULE";
            cron: string;
            timezone?: string | undefined;
            enabled?: boolean | undefined;
        }>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"MANUAL">;
            enabled: import("zod").ZodDefault<import("zod").ZodBoolean>;
        }, "strip", import("zod").ZodTypeAny, {
            type: "MANUAL";
            enabled: boolean;
        }, {
            type: "MANUAL";
            enabled?: boolean | undefined;
        }>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"DEVICE_EVENT">;
            deviceId: import("zod").ZodString;
            event: import("zod").ZodString;
            payload: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodType<unknown, import("zod").ZodTypeDef, unknown>>>;
            enabled: import("zod").ZodDefault<import("zod").ZodBoolean>;
        }, "strip", import("zod").ZodTypeAny, {
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
        }>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"WEBHOOK">;
            token: import("zod").ZodString;
            enabled: import("zod").ZodDefault<import("zod").ZodBoolean>;
        }, "strip", import("zod").ZodTypeAny, {
            type: "WEBHOOK";
            enabled: boolean;
            token: string;
        }, {
            type: "WEBHOOK";
            token: string;
            enabled?: boolean | undefined;
        }>]>, "many">;
        conditions: any;
        actions: import("zod").ZodArray<import("zod").ZodDiscriminatedUnion<"type", [import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"DEVICE_COMMAND">;
            deviceId: import("zod").ZodString;
            command: import("zod").ZodString;
            args: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodType<unknown, import("zod").ZodTypeDef, unknown>>>;
        }, "strip", import("zod").ZodTypeAny, {
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        }, {
            type: "DEVICE_COMMAND";
            deviceId: string;
            command: string;
            args?: Record<string, unknown> | undefined;
        }>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"DELAY">;
            ms: import("zod").ZodNumber;
        }, "strip", import("zod").ZodTypeAny, {
            type: "DELAY";
            ms: number;
        }, {
            type: "DELAY";
            ms: number;
        }>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"NOTIFY">;
            channel: import("zod").ZodDefault<import("zod").ZodEnum<["PUSH", "EMAIL", "TELEGRAM", "WEB"]>>;
            title: import("zod").ZodOptional<import("zod").ZodString>;
            message: import("zod").ZodString;
            data: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodType<unknown, import("zod").ZodTypeDef, unknown>>>;
        }, "strip", import("zod").ZodTypeAny, {
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
        }>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"HTTP_REQUEST">;
            method: import("zod").ZodDefault<import("zod").ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>>;
            url: import("zod").ZodString;
            headers: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>>;
            body: import("zod").ZodOptional<import("zod").ZodType<unknown, import("zod").ZodTypeDef, unknown>>;
            timeoutMs: import("zod").ZodDefault<import("zod").ZodNumber>;
        }, "strip", import("zod").ZodTypeAny, {
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
        options: import("zod").ZodOptional<import("zod").ZodObject<{
            timezone: import("zod").ZodOptional<import("zod").ZodString>;
            debounceMs: import("zod").ZodOptional<import("zod").ZodNumber>;
            maxConcurrency: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, "strip", import("zod").ZodTypeAny, {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        }, {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        }>>;
    }, "strip", import("zod").ZodTypeAny, {
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
}, "strip", import("zod").ZodTypeAny>, {
    description?: string | null | undefined;
    status?: import("../../common/schemas").ScenarioStatus | undefined;
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
export declare class UpdateScenarioDto extends UpdateScenarioDto_base {
}
export {};
