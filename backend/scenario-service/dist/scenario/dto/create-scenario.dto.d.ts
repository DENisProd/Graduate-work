declare const CreateScenarioDto_base: import("nestjs-zod").ZodDto<{
    name: string;
    status: import("../../common/schemas").ScenarioStatus;
    creatorId: string;
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
            enabled: boolean;
            deviceId: string;
            event: string;
            payload?: Record<string, unknown> | undefined;
        } | {
            type: "WEBHOOK";
            enabled: boolean;
            token: string;
        })[];
        conditions: {
            type: "ALWAYS";
        } | {
            path: string;
            type: "DEVICE_STATE";
            deviceId: string;
            op: "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE" | "IN" | "NOT_IN" | "CONTAINS";
            value?: unknown;
        } | {
            type: "TIME_WINDOW";
            from: string;
            to: string;
            timezone?: string | undefined;
        } | {
            type: "AND";
            items: any[];
        } | {
            type: "OR";
            items: any[];
        } | {
            type: "NOT";
            item?: any;
        };
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
            method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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
    };
    description?: string | undefined;
}, import("zod").ZodObjectDef<{
    name: import("zod").ZodString;
    description: import("zod").ZodOptional<import("zod").ZodString>;
    status: import("zod").ZodDefault<import("zod").ZodNativeEnum<typeof import("../../common/schemas").ScenarioStatus>>;
    creatorId: import("zod").ZodString;
    houseId: import("zod").ZodString;
    definition: import("zod").ZodObject<{
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
            enabled: boolean;
            deviceId: string;
            event: string;
            payload?: Record<string, unknown> | undefined;
        }, {
            type: "DEVICE_EVENT";
            deviceId: string;
            event: string;
            enabled?: boolean | undefined;
            payload?: Record<string, unknown> | undefined;
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
        conditions: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodDiscriminatedUnion<"type", [import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"ALWAYS">;
        }, "strip", import("zod").ZodTypeAny, {
            type: "ALWAYS";
        }, {
            type: "ALWAYS";
        }>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"DEVICE_STATE">;
            deviceId: import("zod").ZodString;
            path: import("zod").ZodString;
            op: import("zod").ZodEnum<["EQ", "NE", "GT", "GTE", "LT", "LTE", "IN", "NOT_IN", "CONTAINS"]>;
            value: import("zod").ZodType<unknown, import("zod").ZodTypeDef, unknown>;
        }, "strip", import("zod").ZodTypeAny, {
            path: string;
            type: "DEVICE_STATE";
            deviceId: string;
            op: "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE" | "IN" | "NOT_IN" | "CONTAINS";
            value?: unknown;
        }, {
            path: string;
            type: "DEVICE_STATE";
            deviceId: string;
            op: "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE" | "IN" | "NOT_IN" | "CONTAINS";
            value?: unknown;
        }>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"TIME_WINDOW">;
            from: import("zod").ZodString;
            to: import("zod").ZodString;
            timezone: import("zod").ZodOptional<import("zod").ZodString>;
        }, "strip", import("zod").ZodTypeAny, {
            type: "TIME_WINDOW";
            from: string;
            to: string;
            timezone?: string | undefined;
        }, {
            type: "TIME_WINDOW";
            from: string;
            to: string;
            timezone?: string | undefined;
        }>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"AND">;
            items: import("zod").ZodArray<import("zod").ZodLazy<any>, "many">;
        }, "strip", import("zod").ZodTypeAny, {
            type: "AND";
            items: any[];
        }, {
            type: "AND";
            items: any[];
        }>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"OR">;
            items: import("zod").ZodArray<import("zod").ZodLazy<any>, "many">;
        }, "strip", import("zod").ZodTypeAny, {
            type: "OR";
            items: any[];
        }, {
            type: "OR";
            items: any[];
        }>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"NOT">;
            item: import("zod").ZodLazy<any>;
        }, "strip", import("zod").ZodTypeAny, {
            type: "NOT";
            item?: any;
        }, {
            type: "NOT";
            item?: any;
        }>]>>>;
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
            channel?: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB" | undefined;
            title?: string | undefined;
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
            method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
            url: string;
            timeoutMs: number;
            headers?: Record<string, string> | undefined;
            body?: unknown;
        }, {
            type: "HTTP_REQUEST";
            url: string;
            method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
            headers?: Record<string, string> | undefined;
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
            enabled: boolean;
            deviceId: string;
            event: string;
            payload?: Record<string, unknown> | undefined;
        } | {
            type: "WEBHOOK";
            enabled: boolean;
            token: string;
        })[];
        conditions: {
            type: "ALWAYS";
        } | {
            path: string;
            type: "DEVICE_STATE";
            deviceId: string;
            op: "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE" | "IN" | "NOT_IN" | "CONTAINS";
            value?: unknown;
        } | {
            type: "TIME_WINDOW";
            from: string;
            to: string;
            timezone?: string | undefined;
        } | {
            type: "AND";
            items: any[];
        } | {
            type: "OR";
            items: any[];
        } | {
            type: "NOT";
            item?: any;
        };
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
            method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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
            enabled?: boolean | undefined;
            payload?: Record<string, unknown> | undefined;
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
            channel?: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB" | undefined;
            title?: string | undefined;
            data?: Record<string, unknown> | undefined;
        } | {
            type: "HTTP_REQUEST";
            url: string;
            method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
            headers?: Record<string, string> | undefined;
            body?: unknown;
            timeoutMs?: number | undefined;
        })[];
        options?: {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        } | undefined;
        conditions?: {
            type: "ALWAYS";
        } | {
            path: string;
            type: "DEVICE_STATE";
            deviceId: string;
            op: "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE" | "IN" | "NOT_IN" | "CONTAINS";
            value?: unknown;
        } | {
            type: "TIME_WINDOW";
            from: string;
            to: string;
            timezone?: string | undefined;
        } | {
            type: "AND";
            items: any[];
        } | {
            type: "OR";
            items: any[];
        } | {
            type: "NOT";
            item?: any;
        } | undefined;
    }>;
}, "strip", import("zod").ZodTypeAny>, {
    name: string;
    creatorId: string;
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
            enabled?: boolean | undefined;
            payload?: Record<string, unknown> | undefined;
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
            channel?: "PUSH" | "EMAIL" | "TELEGRAM" | "WEB" | undefined;
            title?: string | undefined;
            data?: Record<string, unknown> | undefined;
        } | {
            type: "HTTP_REQUEST";
            url: string;
            method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined;
            headers?: Record<string, string> | undefined;
            body?: unknown;
            timeoutMs?: number | undefined;
        })[];
        options?: {
            timezone?: string | undefined;
            debounceMs?: number | undefined;
            maxConcurrency?: number | undefined;
        } | undefined;
        conditions?: {
            type: "ALWAYS";
        } | {
            path: string;
            type: "DEVICE_STATE";
            deviceId: string;
            op: "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE" | "IN" | "NOT_IN" | "CONTAINS";
            value?: unknown;
        } | {
            type: "TIME_WINDOW";
            from: string;
            to: string;
            timezone?: string | undefined;
        } | {
            type: "AND";
            items: any[];
        } | {
            type: "OR";
            items: any[];
        } | {
            type: "NOT";
            item?: any;
        } | undefined;
    };
    description?: string | undefined;
    status?: import("../../common/schemas").ScenarioStatus | undefined;
}>;
export declare class CreateScenarioDto extends CreateScenarioDto_base {
}
export {};
