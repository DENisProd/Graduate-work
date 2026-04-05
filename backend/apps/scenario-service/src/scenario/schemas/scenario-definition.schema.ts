import { z } from 'zod';

/**
 * Универсальная структура сценария (Smart Home / Smart Office).
 *
 * Храним в Mongo как JSON в поле ScenarioModel.definition.
 * Версионирование нужно, чтобы безопасно эволюционировать формат.
 */

const jsonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);
const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    jsonPrimitiveSchema,
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

export const scenarioScopeSchema = z.object({
  /** Бизнес-контекст: дом или офис (или иной тип пространства) */
  kind: z.enum(['HOUSE', 'OFFICE']).default('HOUSE'),
  /**
   * Идентификатор пространства.
   * Сейчас в модели есть `houseId`; на переходный период можно хранить тот же id.
   */
  spaceId: z.string().min(1).max(255),
});

export const scenarioTriggerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SCHEDULE'),
    /** cron-строка (5 или 6 полей) */
    cron: z.string().min(1).max(255),
    timezone: z.string().min(1).max(128).optional(),
    enabled: z.boolean().default(true),
  }),
  z.object({
    type: z.literal('MANUAL'),
    enabled: z.boolean().default(true),
  }),
  z.object({
    type: z.literal('DEVICE_EVENT'),
    /** physicalDeviceId / zigbeeDeviceId и т.п. */
    deviceId: z.string().min(1).max(255),
    /** событие/топик/кластер (зависит от интеграции) */
    event: z.string().min(1).max(255),
    /** полезная нагрузка события */
    payload: z.record(jsonValueSchema).optional(),
    enabled: z.boolean().default(true),
  }),
  z.object({
    type: z.literal('WEBHOOK'),
    /** внешний ключ для вызова сценария */
    token: z.string().min(8).max(255),
    enabled: z.boolean().default(true),
  }),
]);
export type ScenarioTrigger = z.infer<typeof scenarioTriggerSchema>;

export const scenarioConditionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ALWAYS'),
  }),
  z.object({
    type: z.literal('DEVICE_STATE'),
    deviceId: z.string().min(1).max(255),
    /** ключ/путь до значения (например, "temperature" или "state.on") */
    path: z.string().min(1).max(255),
    op: z.enum([
      'EQ',
      'NE',
      'GT',
      'GTE',
      'LT',
      'LTE',
      'IN',
      'NOT_IN',
      'CONTAINS',
    ]),
    value: jsonValueSchema,
  }),
  z.object({
    type: z.literal('TIME_WINDOW'),
    /** "HH:mm" */
    from: z.string().regex(/^\d{2}:\d{2}$/),
    /** "HH:mm" */
    to: z.string().regex(/^\d{2}:\d{2}$/),
    timezone: z.string().min(1).max(128).optional(),
  }),
  z.object({
    type: z.literal('AND'),
    items: z.array(z.lazy(() => scenarioConditionSchema)).min(1),
  }),
  z.object({
    type: z.literal('OR'),
    items: z.array(z.lazy(() => scenarioConditionSchema)).min(1),
  }),
  z.object({
    type: z.literal('NOT'),
    item: z.lazy(() => scenarioConditionSchema),
  }),
]);
export type ScenarioCondition = z.infer<typeof scenarioConditionSchema>;

export const scenarioActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('DEVICE_COMMAND'),
    deviceId: z.string().min(1).max(255),
    /** командный ключ (например, "switch", "setBrightness") */
    command: z.string().min(1).max(255),
    args: z.record(jsonValueSchema).optional(),
  }),
  z.object({
    type: z.literal('DELAY'),
    ms: z
      .number()
      .int()
      .min(0)
      .max(24 * 60 * 60 * 1000),
  }),
  z.object({
    type: z.literal('NOTIFY'),
    channel: z.enum(['PUSH', 'EMAIL', 'TELEGRAM', 'WEB']).default('PUSH'),
    title: z.string().min(1).max(255).optional(),
    message: z.string().min(1).max(2000),
    data: z.record(jsonValueSchema).optional(),
  }),
  z.object({
    type: z.literal('HTTP_REQUEST'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('POST'),
    url: z.string().url().max(2000),
    headers: z.record(z.string().max(2000)).optional(),
    body: jsonValueSchema.optional(),
    timeoutMs: z.number().int().min(100).max(120_000).default(10_000),
  }),
]);
export type ScenarioAction = z.infer<typeof scenarioActionSchema>;

export const scenarioDefinitionSchema = z.object({
  version: z.literal(1),
  scope: scenarioScopeSchema,
  triggers: z.array(scenarioTriggerSchema).min(1),
  /** По умолчанию сценарий выполняется всегда */
  conditions: scenarioConditionSchema.optional().default({ type: 'ALWAYS' }),
  actions: z.array(scenarioActionSchema).min(1),
  options: z
    .object({
      timezone: z.string().min(1).max(128).optional(),
      /** защита от частых срабатываний */
      debounceMs: z.number().int().min(0).max(60_000).optional(),
      /** ограничение параллельных запусков */
      maxConcurrency: z.number().int().min(1).max(50).optional(),
    })
    .optional(),
});
export type ScenarioDefinition = z.infer<typeof scenarioDefinitionSchema>;

export const scenarioDefinitionExampleHome = {
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
} as const satisfies ScenarioDefinition;

export const scenarioDefinitionExampleOffice = {
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
} as const satisfies ScenarioDefinition;
