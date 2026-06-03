import { Injectable, Logger } from '@nestjs/common';
import type { ScenarioCondition } from '../scenario/schemas/scenario-definition.schema';
import { ZigbeeService } from '../zigbee/zigbee.service';
import type { TriggerContext } from './scenario-engine.types';

function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && acc !== undefined && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function compareOp(actual: unknown, op: string, expected: unknown): boolean {
  switch (op) {
    case 'EQ':
      return actual === expected;
    case 'NE':
      return actual !== expected;
    case 'GT':
      return (
        typeof actual === 'number' &&
        typeof expected === 'number' &&
        actual > expected
      );
    case 'GTE':
      return (
        typeof actual === 'number' &&
        typeof expected === 'number' &&
        actual >= expected
      );
    case 'LT':
      return (
        typeof actual === 'number' &&
        typeof expected === 'number' &&
        actual < expected
      );
    case 'LTE':
      return (
        typeof actual === 'number' &&
        typeof expected === 'number' &&
        actual <= expected
      );
    case 'IN':
      return Array.isArray(expected) && expected.includes(actual);
    case 'NOT_IN':
      return Array.isArray(expected) && !expected.includes(actual);
    case 'CONTAINS':
      return (
        typeof actual === 'string' &&
        typeof expected === 'string' &&
        actual.includes(expected)
      );
    default:
      return false;
  }
}

function currentTimeInTz(tz: string): string {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const h = (parts.find((p) => p.type === 'hour')?.value ?? '00').padStart(
      2,
      '0',
    );
    const m = (
      parts.find((p) => p.type === 'minute')?.value ?? '00'
    ).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '00:00';
  }
}

@Injectable()
export class ConditionEvaluatorService {
  private readonly logger = new Logger(ConditionEvaluatorService.name);

  constructor(private readonly zigbee: ZigbeeService) {}

  async evaluate(
    condition: ScenarioCondition,
    ctx: TriggerContext,
  ): Promise<boolean> {
    switch (condition.type) {
      case 'ALWAYS':
        return true;

      case 'DEVICE_STATE': {
        const state = await this.zigbee.getLatestStateByFriendlyName(
          condition.deviceId,
        );
        if (!state) {
          this.logger.debug(
            `DEVICE_STATE: нет состояния для устройства "${condition.deviceId}"`,
          );
          return false;
        }
        const actual = getAtPath(state, condition.path);
        const result = compareOp(actual, condition.op, condition.value);
        this.logger.debug(
          `DEVICE_STATE "${condition.deviceId}".${condition.path} ${condition.op} ${JSON.stringify(condition.value)} → actual=${JSON.stringify(actual)} → ${String(result)}`,
        );
        return result;
      }

      case 'TIME_WINDOW': {
        const tz = condition.timezone ?? 'UTC';
        const current = currentTimeInTz(tz);
        const result =
          current >= condition.from && current <= condition.to;
        this.logger.debug(
          `TIME_WINDOW [${condition.from}–${condition.to}] tz=${tz}, now=${current} → ${String(result)}`,
        );
        return result;
      }

      case 'AND': {
        for (const item of condition.items) {
          if (!(await this.evaluate(item, ctx))) return false;
        }
        return true;
      }

      case 'OR': {
        for (const item of condition.items) {
          if (await this.evaluate(item, ctx)) return true;
        }
        return false;
      }

      case 'NOT':
        return !(await this.evaluate(condition.item, ctx));
    }

    return false;
  }
}
