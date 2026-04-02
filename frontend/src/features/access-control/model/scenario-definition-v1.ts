export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ScenarioScopeKindV1 = 'HOUSE' | 'OFFICE';

export type ScenarioDefinitionV1 = {
  version: 1;
  scope: {
    kind: ScenarioScopeKindV1;
    spaceId: string;
  };
  triggers: ScenarioTriggerV1[];
  conditions?: ScenarioConditionV1;
  actions: ScenarioActionV1[];
  options?: {
    timezone?: string;
    debounceMs?: number;
    maxConcurrency?: number;
  };
};

export type ScenarioTriggerV1 =
  | {
      type: 'SCHEDULE';
      cron: string;
      timezone?: string;
      enabled: boolean;
    }
  | {
      type: 'MANUAL';
      enabled: boolean;
    }
  | {
      type: 'DEVICE_EVENT';
      deviceId: string;
      event: string;
      payload?: Record<string, JsonValue>;
      enabled: boolean;
    }
  | {
      type: 'WEBHOOK';
      token: string;
      enabled: boolean;
    };

export type ScenarioConditionV1 =
  | { type: 'ALWAYS' }
  | {
      type: 'DEVICE_STATE';
      deviceId: string;
      path: string;
      op:
        | 'EQ'
        | 'NE'
        | 'GT'
        | 'GTE'
        | 'LT'
        | 'LTE'
        | 'IN'
        | 'NOT_IN'
        | 'CONTAINS';
      value: JsonValue;
    }
  | {
      type: 'TIME_WINDOW';
      from: string;
      to: string;
      timezone?: string;
    }
  | { type: 'AND'; items: ScenarioConditionV1[] }
  | { type: 'OR'; items: ScenarioConditionV1[] }
  | { type: 'NOT'; item: ScenarioConditionV1 };

export type ScenarioActionV1 =
  | {
      type: 'DEVICE_COMMAND';
      deviceId: string;
      command: string;
      args?: Record<string, JsonValue>;
    }
  | {
      type: 'DELAY';
      ms: number;
    }
  | {
      type: 'NOTIFY';
      channel: 'PUSH' | 'EMAIL' | 'TELEGRAM' | 'WEB';
      title?: string;
      message: string;
      data?: Record<string, JsonValue>;
    }
  | {
      type: 'HTTP_REQUEST';
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: JsonValue;
      timeoutMs?: number;
    };

export type ScenarioStatus = 'OFFLINE' | 'ONLINE' | 'ERROR';

export type ScenarioEntity = {
  id: string;
  name: string;
  description: string | null;
  houseId: string;
  status: ScenarioStatus;
  creatorId: string;
  definition: ScenarioDefinitionV1;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type CreateScenarioDto = {
  name: string;
  status: ScenarioStatus;
  creatorId: string;
  houseId: string;
  description?: string | null;
  definition: ScenarioDefinitionV1;
};

export type UpdateScenarioDto = Partial<Pick<CreateScenarioDto, 'name' | 'status' | 'description' | 'definition'>>;

export type ValidationIssue = { path: string; message: string };

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isValidTimeHHmm = (v: string) => /^\d{2}:\d{2}$/.test(v) && (() => {
  const [hh, mm] = v.split(':').map((x) => Number(x));
  return Number.isFinite(hh) && Number.isFinite(mm) && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
})();

export function validateScenarioDefinitionV1(def: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isObject(def)) return [{ path: 'definition', message: 'Definition must be an object' }];
  if (def.version !== 1) issues.push({ path: 'definition.version', message: 'version must be 1' });

  const scope = def.scope;
  if (!isObject(scope)) {
    issues.push({ path: 'definition.scope', message: 'scope is required' });
  } else {
    const kind = scope.kind;
    if (kind !== 'HOUSE' && kind !== 'OFFICE') {
      issues.push({ path: 'definition.scope.kind', message: 'kind must be HOUSE or OFFICE' });
    }
    if (typeof scope.spaceId !== 'string' || scope.spaceId.trim().length === 0) {
      issues.push({ path: 'definition.scope.spaceId', message: 'spaceId is required' });
    }
  }

  const triggers = def.triggers;
  if (!Array.isArray(triggers) || triggers.length < 1) {
    issues.push({ path: 'definition.triggers', message: 'At least 1 trigger is required' });
  } else {
    triggers.forEach((t, idx) => {
      if (!isObject(t) || typeof t.type !== 'string') {
        issues.push({ path: `definition.triggers[${idx}]`, message: 'Invalid trigger' });
        return;
      }
      if (typeof (t as any).enabled !== 'boolean') {
        issues.push({ path: `definition.triggers[${idx}].enabled`, message: 'enabled is required' });
      }
      switch (t.type) {
        case 'SCHEDULE':
          if (typeof (t as any).cron !== 'string' || !(t as any).cron.trim()) {
            issues.push({ path: `definition.triggers[${idx}].cron`, message: 'cron is required' });
          }
          if ((t as any).timezone != null && typeof (t as any).timezone !== 'string') {
            issues.push({ path: `definition.triggers[${idx}].timezone`, message: 'timezone must be a string' });
          }
          break;
        case 'MANUAL':
          break;
        case 'DEVICE_EVENT':
          if (typeof (t as any).deviceId !== 'string' || !(t as any).deviceId.trim()) {
            issues.push({ path: `definition.triggers[${idx}].deviceId`, message: 'deviceId is required' });
          }
          if (typeof (t as any).event !== 'string' || !(t as any).event.trim()) {
            issues.push({ path: `definition.triggers[${idx}].event`, message: 'event is required' });
          }
          if ((t as any).payload != null && !isObject((t as any).payload)) {
            issues.push({ path: `definition.triggers[${idx}].payload`, message: 'payload must be an object' });
          }
          break;
        case 'WEBHOOK':
          if (typeof (t as any).token !== 'string' || !(t as any).token.trim()) {
            issues.push({ path: `definition.triggers[${idx}].token`, message: 'token is required' });
          }
          break;
        default:
          issues.push({ path: `definition.triggers[${idx}].type`, message: 'Unknown trigger type' });
      }
    });
  }

  const conditions = def.conditions;
  if (conditions != null) {
    issues.push(...validateConditionNodeV1(conditions, 'definition.conditions'));
  }

  const actions = def.actions;
  if (!Array.isArray(actions) || actions.length < 1) {
    issues.push({ path: 'definition.actions', message: 'At least 1 action is required' });
  } else {
    actions.forEach((a, idx) => {
      if (!isObject(a) || typeof a.type !== 'string') {
        issues.push({ path: `definition.actions[${idx}]`, message: 'Invalid action' });
        return;
      }
      switch (a.type) {
        case 'DEVICE_COMMAND':
          if (typeof (a as any).deviceId !== 'string' || !(a as any).deviceId.trim()) {
            issues.push({ path: `definition.actions[${idx}].deviceId`, message: 'deviceId is required' });
          }
          if (typeof (a as any).command !== 'string' || !(a as any).command.trim()) {
            issues.push({ path: `definition.actions[${idx}].command`, message: 'command is required' });
          }
          if ((a as any).args != null && !isObject((a as any).args)) {
            issues.push({ path: `definition.actions[${idx}].args`, message: 'args must be an object' });
          }
          break;
        case 'DELAY':
          if (typeof (a as any).ms !== 'number' || !Number.isFinite((a as any).ms)) {
            issues.push({ path: `definition.actions[${idx}].ms`, message: 'ms must be a number' });
          } else if ((a as any).ms < 0 || (a as any).ms > 24 * 60 * 60 * 1000) {
            issues.push({ path: `definition.actions[${idx}].ms`, message: 'ms must be between 0 and 24h' });
          }
          break;
        case 'NOTIFY':
          if (!['PUSH', 'EMAIL', 'TELEGRAM', 'WEB'].includes(String((a as any).channel))) {
            issues.push({ path: `definition.actions[${idx}].channel`, message: 'Invalid channel' });
          }
          if (typeof (a as any).message !== 'string' || !(a as any).message.trim()) {
            issues.push({ path: `definition.actions[${idx}].message`, message: 'message is required' });
          }
          if ((a as any).data != null && !isObject((a as any).data)) {
            issues.push({ path: `definition.actions[${idx}].data`, message: 'data must be an object' });
          }
          break;
        case 'HTTP_REQUEST':
          if (typeof (a as any).method !== 'string' || !(a as any).method.trim()) {
            issues.push({ path: `definition.actions[${idx}].method`, message: 'method is required' });
          }
          if (typeof (a as any).url !== 'string' || !(a as any).url.trim()) {
            issues.push({ path: `definition.actions[${idx}].url`, message: 'url is required' });
          } else {
            try {
              // eslint-disable-next-line no-new
              new URL((a as any).url);
            } catch {
              issues.push({ path: `definition.actions[${idx}].url`, message: 'url is invalid' });
            }
          }
          if ((a as any).headers != null && !isObject((a as any).headers)) {
            issues.push({ path: `definition.actions[${idx}].headers`, message: 'headers must be an object' });
          }
          if ((a as any).timeoutMs != null) {
            if (typeof (a as any).timeoutMs !== 'number' || !Number.isFinite((a as any).timeoutMs)) {
              issues.push({ path: `definition.actions[${idx}].timeoutMs`, message: 'timeoutMs must be a number' });
            } else if ((a as any).timeoutMs < 0) {
              issues.push({ path: `definition.actions[${idx}].timeoutMs`, message: 'timeoutMs must be >= 0' });
            }
          }
          break;
        default:
          issues.push({ path: `definition.actions[${idx}].type`, message: 'Unknown action type' });
      }
    });
  }

  const options = def.options;
  if (options != null) {
    if (!isObject(options)) {
      issues.push({ path: 'definition.options', message: 'options must be an object' });
    } else {
      if ((options as any).timezone != null && typeof (options as any).timezone !== 'string') {
        issues.push({ path: 'definition.options.timezone', message: 'timezone must be a string' });
      }
      if ((options as any).debounceMs != null) {
        const v = (options as any).debounceMs;
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          issues.push({ path: 'definition.options.debounceMs', message: 'debounceMs must be a number' });
        } else if (v < 0 || v > 60000) {
          issues.push({ path: 'definition.options.debounceMs', message: 'debounceMs must be 0..60000' });
        }
      }
      if ((options as any).maxConcurrency != null) {
        const v = (options as any).maxConcurrency;
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          issues.push({ path: 'definition.options.maxConcurrency', message: 'maxConcurrency must be a number' });
        } else if (v < 1 || v > 50) {
          issues.push({ path: 'definition.options.maxConcurrency', message: 'maxConcurrency must be 1..50' });
        }
      }
    }
  }

  return issues;
}

function validateConditionNodeV1(node: unknown, basePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isObject(node) || typeof node.type !== 'string') return [{ path: basePath, message: 'Invalid condition' }];

  switch (node.type) {
    case 'ALWAYS':
      return issues;
    case 'DEVICE_STATE': {
      if (typeof (node as any).deviceId !== 'string' || !(node as any).deviceId.trim()) {
        issues.push({ path: `${basePath}.deviceId`, message: 'deviceId is required' });
      }
      if (typeof (node as any).path !== 'string' || !(node as any).path.trim()) {
        issues.push({ path: `${basePath}.path`, message: 'path is required' });
      }
      const op = (node as any).op;
      const allowed = ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NOT_IN', 'CONTAINS'];
      if (!allowed.includes(String(op))) {
        issues.push({ path: `${basePath}.op`, message: 'Invalid op' });
      }
      if (!('value' in node)) {
        issues.push({ path: `${basePath}.value`, message: 'value is required' });
      }
      return issues;
    }
    case 'TIME_WINDOW': {
      const from = (node as any).from;
      const to = (node as any).to;
      if (typeof from !== 'string' || !isValidTimeHHmm(from)) {
        issues.push({ path: `${basePath}.from`, message: 'from must be HH:mm' });
      }
      if (typeof to !== 'string' || !isValidTimeHHmm(to)) {
        issues.push({ path: `${basePath}.to`, message: 'to must be HH:mm' });
      }
      if ((node as any).timezone != null && typeof (node as any).timezone !== 'string') {
        issues.push({ path: `${basePath}.timezone`, message: 'timezone must be a string' });
      }
      return issues;
    }
    case 'AND':
    case 'OR': {
      const items = (node as any).items;
      if (!Array.isArray(items) || items.length < 1) {
        issues.push({ path: `${basePath}.items`, message: 'At least 1 item is required' });
        return issues;
      }
      items.forEach((it, idx) => issues.push(...validateConditionNodeV1(it, `${basePath}.items[${idx}]`)));
      return issues;
    }
    case 'NOT': {
      if (!('item' in node)) {
        issues.push({ path: `${basePath}.item`, message: 'item is required' });
        return issues;
      }
      issues.push(...validateConditionNodeV1((node as any).item, `${basePath}.item`));
      return issues;
    }
    default:
      return [{ path: `${basePath}.type`, message: 'Unknown condition type' }];
  }
}

export function createDefaultScenarioDefinitionV1(params: {
  scopeKind: ScenarioScopeKindV1;
  spaceId: string;
}): ScenarioDefinitionV1 {
  return {
    version: 1,
    scope: { kind: params.scopeKind, spaceId: params.spaceId },
    triggers: [{ type: 'MANUAL', enabled: true }],
    conditions: { type: 'ALWAYS' },
    actions: [{ type: 'DELAY', ms: 1000 }],
    options: {},
  };
}

export function createEmptyScenarioDefinitionV1(params: {
  scopeKind: ScenarioScopeKindV1;
  spaceId: string;
}): ScenarioDefinitionV1 {
  return {
    version: 1,
    scope: { kind: params.scopeKind, spaceId: params.spaceId },
    triggers: [],
    actions: [],
    options: {},
  };
}

export function generateWebhookToken(length = 24) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

