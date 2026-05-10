import { Injectable, Logger } from '@nestjs/common';
import type { ScenarioAction } from '../scenario/schemas/scenario-definition.schema';
import { ZigbeeService } from '../zigbee/zigbee.service';
import type { TriggerContext } from './scenario-engine.types';

@Injectable()
export class ActionExecutorService {
  private readonly logger = new Logger(ActionExecutorService.name);

  constructor(private readonly zigbee: ZigbeeService) {}

  /**
   * Executes actions sequentially; DELAY actions suspend the chain.
   * Throws on the first action failure so the caller can record the error.
   */
  async executeAll(
    actions: ScenarioAction[],
    houseId: string,
    ctx: TriggerContext,
  ): Promise<void> {
    for (const action of actions) {
      await this.executeOne(action, houseId, ctx);
    }
  }

  private async executeOne(
    action: ScenarioAction,
    houseId: string,
    _ctx: TriggerContext,
  ): Promise<void> {
    switch (action.type) {
      case 'DEVICE_COMMAND': {
        const payload: Record<string, unknown> = { ...(action.args ?? {}) };
        const result = this.zigbee.sendCommandToFriendlyName(
          houseId,
          action.deviceId,
          payload,
        );
        if (!result.ok) {
          this.logger.warn(
            `DEVICE_COMMAND ${action.deviceId}/${action.command} → ошибка: ${result.error}`,
          );
          throw new Error(result.error);
        }
        this.logger.debug(
          `DEVICE_COMMAND ${action.deviceId}/${action.command} → ${result.topic}`,
        );
        break;
      }

      case 'DELAY':
        await new Promise<void>((resolve) => setTimeout(resolve, action.ms));
        this.logger.debug(`DELAY ${action.ms} мс`);
        break;

      case 'NOTIFY':
        // Notifications are logged; push/email/telegram delivery can be wired here later.
        this.logger.log(
          `[NOTIFY][${action.channel}] ${action.title ?? '—'}: ${action.message}`,
        );
        break;

      case 'HTTP_REQUEST':
        await this.executeHttpRequest(action);
        break;
    }
  }

  private async executeHttpRequest(
    action: Extract<ScenarioAction, { type: 'HTTP_REQUEST' }>,
  ): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      action.timeoutMs ?? 10_000,
    );
    try {
      const res = await fetch(action.url, {
        method: action.method ?? 'POST',
        headers: action.headers as Record<string, string> | undefined,
        body:
          action.body !== undefined
            ? JSON.stringify(action.body)
            : undefined,
        signal: controller.signal,
      });
      this.logger.log(
        `HTTP_REQUEST ${action.method} ${action.url} → ${res.status}`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`HTTP_REQUEST ${action.url} → ошибка: ${msg}`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
