import { z } from 'zod';
export declare const scenarioScopeSchema: z.ZodObject<{
    kind: z.ZodDefault<z.ZodEnum<["HOUSE", "OFFICE"]>>;
    spaceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    kind: "HOUSE" | "OFFICE";
    spaceId: string;
}, {
    spaceId: string;
    kind?: "HOUSE" | "OFFICE" | undefined;
}>;
export declare const scenarioTriggerSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
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
}>]>;
export type ScenarioTrigger = z.infer<typeof scenarioTriggerSchema>;
export declare const scenarioConditionSchema: any;
export type ScenarioCondition = z.infer<typeof scenarioConditionSchema>;
export declare const scenarioActionSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
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
    method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
    url: string;
    timeoutMs: number;
    headers?: Record<string, string> | undefined;
    body?: unknown;
}, {
    type: "HTTP_REQUEST";
    url: string;
    headers?: Record<string, string> | undefined;
    method?: "POST" | "GET" | "PUT" | "PATCH" | "DELETE" | undefined;
    body?: unknown;
    timeoutMs?: number | undefined;
}>]>;
export type ScenarioAction = z.infer<typeof scenarioActionSchema>;
export declare const scenarioDefinitionSchema: z.ZodObject<{
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
        method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
        url: string;
        timeoutMs: number;
        headers?: Record<string, string> | undefined;
        body?: unknown;
    }, {
        type: "HTTP_REQUEST";
        url: string;
        headers?: Record<string, string> | undefined;
        method?: "POST" | "GET" | "PUT" | "PATCH" | "DELETE" | undefined;
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
        method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
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
        method?: "POST" | "GET" | "PUT" | "PATCH" | "DELETE" | undefined;
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
export type ScenarioDefinition = z.infer<typeof scenarioDefinitionSchema>;
export declare const scenarioDefinitionExampleHome: {
    readonly version: 1;
    readonly scope: {
        readonly kind: "HOUSE";
        readonly spaceId: "house_123";
    };
    readonly triggers: [{
        readonly type: "SCHEDULE";
        readonly cron: "0 7 * * *";
        readonly timezone: "Europe/Moscow";
        readonly enabled: true;
    }];
    readonly conditions: {
        readonly type: "TIME_WINDOW";
        readonly from: "06:30";
        readonly to: "09:30";
        readonly timezone: "Europe/Moscow";
    };
    readonly actions: [{
        readonly type: "DEVICE_COMMAND";
        readonly deviceId: "lamp_kitchen_1";
        readonly command: "switch";
        readonly args: {
            readonly on: true;
        };
    }, {
        readonly type: "DELAY";
        readonly ms: 500;
    }, {
        readonly type: "DEVICE_COMMAND";
        readonly deviceId: "thermostat_1";
        readonly command: "setTemperature";
        readonly args: {
            readonly temperature: 22;
        };
    }, {
        readonly type: "NOTIFY";
        readonly channel: "PUSH";
        readonly title: "Утренний сценарий";
        readonly message: "Свет и климат включены";
        readonly data: {
            readonly scene: "morning";
        };
    }];
    readonly options: {
        readonly debounceMs: 2000;
        readonly maxConcurrency: 1;
        readonly timezone: "Europe/Moscow";
    };
};
export declare const scenarioDefinitionExampleOffice: {
    readonly version: 1;
    readonly scope: {
        readonly kind: "OFFICE";
        readonly spaceId: "office_77";
    };
    readonly triggers: [{
        readonly type: "DEVICE_EVENT";
        readonly deviceId: "motion_meetingroom_1";
        readonly event: "MOTION";
        readonly payload: {
            readonly detected: true;
        };
        readonly enabled: true;
    }];
    readonly conditions: {
        readonly type: "AND";
        readonly items: readonly [{
            readonly type: "TIME_WINDOW";
            readonly from: "08:00";
            readonly to: "20:00";
            readonly timezone: "Europe/Moscow";
        }, {
            readonly type: "DEVICE_STATE";
            readonly deviceId: "alarm_panel_1";
            readonly path: "armed";
            readonly op: "EQ";
            readonly value: false;
        }];
    };
    readonly actions: [{
        readonly type: "DEVICE_COMMAND";
        readonly deviceId: "light_meetingroom_1";
        readonly command: "setBrightness";
        readonly args: {
            readonly brightness: 80;
        };
    }, {
        readonly type: "HTTP_REQUEST";
        readonly method: "POST";
        readonly url: "https://example.com/webhook/office-analytics";
        readonly body: {
            readonly room: "meeting";
            readonly event: "occupied";
        };
        readonly timeoutMs: 5000;
    }];
    readonly options: {
        readonly debounceMs: 10000;
        readonly maxConcurrency: 2;
        readonly timezone: "Europe/Moscow";
    };
};
