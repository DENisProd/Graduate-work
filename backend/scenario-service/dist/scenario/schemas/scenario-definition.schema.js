"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scenarioDefinitionExampleOffice = exports.scenarioDefinitionExampleHome = exports.scenarioDefinitionSchema = exports.scenarioActionSchema = exports.scenarioConditionSchema = exports.scenarioTriggerSchema = exports.scenarioScopeSchema = void 0;
const zod_1 = require("zod");
const jsonPrimitiveSchema = zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.null()]);
const jsonValueSchema = zod_1.z.lazy(() => zod_1.z.union([jsonPrimitiveSchema, zod_1.z.array(jsonValueSchema), zod_1.z.record(jsonValueSchema)]));
exports.scenarioScopeSchema = zod_1.z.object({
    kind: zod_1.z.enum(['HOUSE', 'OFFICE']).default('HOUSE'),
    spaceId: zod_1.z.string().min(1).max(255),
});
exports.scenarioTriggerSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal('SCHEDULE'),
        cron: zod_1.z.string().min(1).max(255),
        timezone: zod_1.z.string().min(1).max(128).optional(),
        enabled: zod_1.z.boolean().default(true),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('MANUAL'),
        enabled: zod_1.z.boolean().default(true),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('DEVICE_EVENT'),
        deviceId: zod_1.z.string().min(1).max(255),
        event: zod_1.z.string().min(1).max(255),
        payload: zod_1.z.record(jsonValueSchema).optional(),
        enabled: zod_1.z.boolean().default(true),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('WEBHOOK'),
        token: zod_1.z.string().min(8).max(255),
        enabled: zod_1.z.boolean().default(true),
    }),
]);
exports.scenarioConditionSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal('ALWAYS'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('DEVICE_STATE'),
        deviceId: zod_1.z.string().min(1).max(255),
        path: zod_1.z.string().min(1).max(255),
        op: zod_1.z.enum(['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NOT_IN', 'CONTAINS']),
        value: jsonValueSchema,
    }),
    zod_1.z.object({
        type: zod_1.z.literal('TIME_WINDOW'),
        from: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
        to: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
        timezone: zod_1.z.string().min(1).max(128).optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('AND'),
        items: zod_1.z.array(zod_1.z.lazy(() => exports.scenarioConditionSchema)).min(1),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('OR'),
        items: zod_1.z.array(zod_1.z.lazy(() => exports.scenarioConditionSchema)).min(1),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('NOT'),
        item: zod_1.z.lazy(() => exports.scenarioConditionSchema),
    }),
]);
exports.scenarioActionSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal('DEVICE_COMMAND'),
        deviceId: zod_1.z.string().min(1).max(255),
        command: zod_1.z.string().min(1).max(255),
        args: zod_1.z.record(jsonValueSchema).optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('DELAY'),
        ms: zod_1.z.number().int().min(0).max(24 * 60 * 60 * 1000),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('NOTIFY'),
        channel: zod_1.z.enum(['PUSH', 'EMAIL', 'TELEGRAM', 'WEB']).default('PUSH'),
        title: zod_1.z.string().min(1).max(255).optional(),
        message: zod_1.z.string().min(1).max(2000),
        data: zod_1.z.record(jsonValueSchema).optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('HTTP_REQUEST'),
        method: zod_1.z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('POST'),
        url: zod_1.z.string().url().max(2000),
        headers: zod_1.z.record(zod_1.z.string().max(2000)).optional(),
        body: jsonValueSchema.optional(),
        timeoutMs: zod_1.z.number().int().min(100).max(120_000).default(10_000),
    }),
]);
exports.scenarioDefinitionSchema = zod_1.z.object({
    version: zod_1.z.literal(1),
    scope: exports.scenarioScopeSchema,
    triggers: zod_1.z.array(exports.scenarioTriggerSchema).min(1),
    conditions: exports.scenarioConditionSchema.optional().default({ type: 'ALWAYS' }),
    actions: zod_1.z.array(exports.scenarioActionSchema).min(1),
    options: zod_1.z
        .object({
        timezone: zod_1.z.string().min(1).max(128).optional(),
        debounceMs: zod_1.z.number().int().min(0).max(60_000).optional(),
        maxConcurrency: zod_1.z.number().int().min(1).max(50).optional(),
    })
        .optional(),
});
exports.scenarioDefinitionExampleHome = {
    version: 1,
    scope: { kind: 'HOUSE', spaceId: 'house_123' },
    triggers: [
        {
            type: 'SCHEDULE',
            cron: '0 7 * * *',
            timezone: 'Europe/Moscow',
            enabled: true,
        },
    ],
    conditions: {
        type: 'TIME_WINDOW',
        from: '06:30',
        to: '09:30',
        timezone: 'Europe/Moscow',
    },
    actions: [
        {
            type: 'DEVICE_COMMAND',
            deviceId: 'lamp_kitchen_1',
            command: 'switch',
            args: { on: true },
        },
        { type: 'DELAY', ms: 500 },
        {
            type: 'DEVICE_COMMAND',
            deviceId: 'thermostat_1',
            command: 'setTemperature',
            args: { temperature: 22 },
        },
        {
            type: 'NOTIFY',
            channel: 'PUSH',
            title: 'Утренний сценарий',
            message: 'Свет и климат включены',
            data: { scene: 'morning' },
        },
    ],
    options: { debounceMs: 2000, maxConcurrency: 1, timezone: 'Europe/Moscow' },
};
exports.scenarioDefinitionExampleOffice = {
    version: 1,
    scope: { kind: 'OFFICE', spaceId: 'office_77' },
    triggers: [
        {
            type: 'DEVICE_EVENT',
            deviceId: 'motion_meetingroom_1',
            event: 'MOTION',
            payload: { detected: true },
            enabled: true,
        },
    ],
    conditions: {
        type: 'AND',
        items: [
            {
                type: 'TIME_WINDOW',
                from: '08:00',
                to: '20:00',
                timezone: 'Europe/Moscow',
            },
            {
                type: 'DEVICE_STATE',
                deviceId: 'alarm_panel_1',
                path: 'armed',
                op: 'EQ',
                value: false,
            },
        ],
    },
    actions: [
        {
            type: 'DEVICE_COMMAND',
            deviceId: 'light_meetingroom_1',
            command: 'setBrightness',
            args: { brightness: 80 },
        },
        {
            type: 'HTTP_REQUEST',
            method: 'POST',
            url: 'https://example.com/webhook/office-analytics',
            body: { room: 'meeting', event: 'occupied' },
            timeoutMs: 5000,
        },
    ],
    options: { debounceMs: 10_000, maxConcurrency: 2, timezone: 'Europe/Moscow' },
};
//# sourceMappingURL=scenario-definition.schema.js.map