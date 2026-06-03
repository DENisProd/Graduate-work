import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import {
  SCENARIO_MODEL,
  type ScenarioDocument,
  ScenarioModel,
} from '../mongo/schemas/scenario.mongo';
import {
  ScenarioExecutionStatus,
  ScenarioStatus,
} from '../common/schemas/enums';
import {
  scenarioDefinitionSchema,
  type ScenarioDefinition,
} from '../scenario/schemas/scenario-definition.schema';
import { ZigbeeService } from '../zigbee/zigbee.service';
import { ScenarioExecutionService } from '../scenario-execution/scenario-execution.service';
import { ConditionEvaluatorService } from './condition-evaluator.service';
import { ActionExecutorService } from './action-executor.service';
import { ConcurrencyGuardService } from './concurrency-guard.service';
import {
  triggerContextToSource,
  type DeviceStateEvent,
  type TriggerContext,
} from './scenario-engine.types';

function payloadMatches(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
): boolean {
  for (const [k, v] of Object.entries(expected)) {
    if (actual[k] !== v) return false;
  }
  return true;
}

@Injectable()
export class ScenarioEngineService implements OnModuleInit {
  private readonly logger = new Logger(ScenarioEngineService.name);

  private readonly cronJobs = new Map<string, string>();

  constructor(
    @InjectModel(SCENARIO_MODEL)
    private readonly scenarioModel: Model<ScenarioModel>,
    private readonly zigbee: ZigbeeService,
    private readonly conditionEvaluator: ConditionEvaluatorService,
    private readonly actionExecutor: ActionExecutorService,
    private readonly concurrencyGuard: ConcurrencyGuardService,
    private readonly executionService: ScenarioExecutionService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit(): Promise<void> {
    this.zigbee.deviceState$.subscribe((event) => {
      void this.handleDeviceStateEvent(event);
    });

    await this.reloadScheduledTriggers();
  }

  async reloadScheduledTriggers(): Promise<void> {
    for (const jobId of this.cronJobs.keys()) {
      try {
        this.schedulerRegistry.deleteCronJob(jobId);
      } catch {
      }
    }
    this.cronJobs.clear();

    const scenarios = await this.scenarioModel
      .find({ status: ScenarioStatus.ONLINE })
      .exec();

    let cronCount = 0;
    for (const scenario of scenarios) {
      cronCount += this.registerScenarioCronJobs(scenario);
    }

    this.logger.log(
      `Движок сценариев: ${scenarios.length} активных, ${cronCount} cron-триггеров`,
    );
  }

  async fireManual(
    scenarioId: string,
    initiatorId?: string,
  ): Promise<{ executionId: string }> {
    const scenario = await this.scenarioModel.findById(scenarioId).exec();
    if (!scenario) {
      throw new NotFoundException(`Сценарий ${scenarioId} не найден`);
    }
    if (scenario.status !== ScenarioStatus.ONLINE) {
      throw new BadRequestException(
        `Сценарий неактивен (статус: ${scenario.status})`,
      );
    }

    const def = this.parseDefinition(scenario);
    const idStr = this.toIdStr(scenario);
    const options = def.options ?? {};

    if (
      !this.concurrencyGuard.canFire(
        idStr,
        options.debounceMs ?? 0,
        options.maxConcurrency ?? 1,
      )
    ) {
      throw new BadRequestException(
        `Сценарий уже выполняется или защита от частых срабатываний активна`,
      );
    }

    const ctx: TriggerContext = { type: 'MANUAL', initiatorId };
    return this.startExecution(scenario, def, ctx);
  }

  async fireWebhook(
    token: string,
    webhookPayload?: Record<string, unknown>,
  ): Promise<{ executionId: string }> {
    const scenario = await this.scenarioModel
      .findOne({
        status: ScenarioStatus.ONLINE,
        'definition.triggers': { $elemMatch: { type: 'WEBHOOK', token } },
      })
      .exec();

    if (!scenario) {
      throw new NotFoundException(
        `Webhook-токен не найден или сценарий неактивен`,
      );
    }

    const def = this.parseDefinition(scenario);
    const idStr = this.toIdStr(scenario);
    const options = def.options ?? {};

    if (
      !this.concurrencyGuard.canFire(
        idStr,
        options.debounceMs ?? 0,
        options.maxConcurrency ?? 1,
      )
    ) {
      throw new BadRequestException(`Сценарий занят`);
    }

    const ctx: TriggerContext = {
      type: 'WEBHOOK',
      webhookToken: token,
      webhookPayload,
    };
    return this.startExecution(scenario, def, ctx);
  }

  private registerScenarioCronJobs(scenario: ScenarioDocument): number {
    const scenarioId = this.toIdStr(scenario);
    const parseResult = scenarioDefinitionSchema.safeParse(scenario.definition);
    if (!parseResult.success) return 0;

    const def = parseResult.data;
    let count = 0;

    for (const trigger of def.triggers) {
      if (trigger.type !== 'SCHEDULE' || !trigger.enabled) continue;

      const tz =
        trigger.timezone ?? def.options?.timezone ?? 'Europe/Moscow';
      const jobId = `engine:${scenarioId}:${trigger.cron.replace(/\s+/g, '_')}`;

      try {
        const job = new CronJob(
          trigger.cron,
          () => {
            void this.fireTrigger({ type: 'SCHEDULE' }, scenarioId);
          },
          null,
          true,
          tz,
        );
        this.schedulerRegistry.addCronJob(jobId, job);
        this.cronJobs.set(jobId, scenarioId);
        count++;
        this.logger.debug(
          `Cron "${trigger.cron}" [${tz}] → сценарий "${scenario.name}" (${scenarioId})`,
        );
      } catch (e) {
        this.logger.warn(
          `Не удалось зарегистрировать cron "${trigger.cron}" для сценария ${scenarioId}: ${String(e)}`,
        );
      }
    }

    return count;
  }

  private async handleDeviceStateEvent(event: DeviceStateEvent): Promise<void> {
    if (!event.houseId) return;

    const scenarios = await this.scenarioModel
      .find({ status: ScenarioStatus.ONLINE, houseId: event.houseId })
      .select({ definition: 1, _id: 1, name: 1 })
      .exec();

    for (const scenario of scenarios) {
      const parseResult = scenarioDefinitionSchema.safeParse(
        scenario.definition,
      );
      if (!parseResult.success) continue;

      for (const trigger of parseResult.data.triggers) {
        if (
          trigger.type !== 'DEVICE_EVENT' ||
          !trigger.enabled ||
          trigger.deviceId !== event.friendlyName
        ) {
          continue;
        }

        if (
          trigger.payload &&
          !payloadMatches(
            trigger.payload as Record<string, unknown>,
            event.payload,
          )
        ) {
          continue;
        }

        await this.fireTrigger(
          { type: 'DEVICE_EVENT', deviceEvent: event },
          this.toIdStr(scenario),
        );
        break;
      }
    }
  }

  private async fireTrigger(
    ctx: TriggerContext,
    scenarioId: string,
  ): Promise<void> {
    try {
      const scenario = await this.scenarioModel.findById(scenarioId).exec();
      if (!scenario || scenario.status !== ScenarioStatus.ONLINE) return;

      const parseResult = scenarioDefinitionSchema.safeParse(
        scenario.definition,
      );
      if (!parseResult.success) return;

      const def = parseResult.data;
      const options = def.options ?? {};

      if (
        !this.concurrencyGuard.canFire(
          scenarioId,
          options.debounceMs ?? 0,
          options.maxConcurrency ?? 1,
        )
      ) {
        this.logger.debug(
          `Пропуск сценария ${scenarioId} (debounce/concurrency)`,
        );
        return;
      }

      const execution = await this.executionService.create({
        scenarioId,
        status: ScenarioExecutionStatus.RUNNING,
        triggeredBy: triggerContextToSource(ctx),
        triggerData: ctx.deviceEvent?.payload ?? ctx.webhookPayload ?? {},
      });

      void this.doRunScenario(scenario, def, ctx, execution.id);
    } catch (error) {
      this.logger.error(
        `fireTrigger error [${scenarioId}]: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async startExecution(
    scenario: ScenarioDocument,
    def: ScenarioDefinition,
    ctx: TriggerContext,
  ): Promise<{ executionId: string }> {
    const scenarioId = this.toIdStr(scenario);

    const execution = await this.executionService.create({
      scenarioId,
      status: ScenarioExecutionStatus.RUNNING,
      triggeredBy: triggerContextToSource(ctx),
      triggerData: ctx.webhookPayload ?? {},
    });

    void this.doRunScenario(scenario, def, ctx, execution.id);

    return { executionId: execution.id };
  }

  private async doRunScenario(
    scenario: ScenarioDocument,
    def: ScenarioDefinition,
    ctx: TriggerContext,
    executionId: string,
  ): Promise<void> {
    const scenarioId = this.toIdStr(scenario);
    this.concurrencyGuard.acquire(scenarioId);

    this.logger.log(
      `▶ "${scenario.name}" (${scenarioId}) trigger=${ctx.type} execution=${executionId}`,
    );

    try {
      const conditionMet = await this.conditionEvaluator.evaluate(
        def.conditions,
        ctx,
      );

      if (!conditionMet) {
        this.logger.debug(
          `"${scenario.name}" (${scenarioId}): условия не выполнены — пропуск`,
        );
        await this.executionService.update(executionId, {
          status: ScenarioExecutionStatus.SUCCESS,
          endedAt: new Date(),
        });
        return;
      }

      await this.actionExecutor.executeAll(
        def.actions,
        def.scope.spaceId,
        ctx,
      );

      await this.executionService.update(executionId, {
        status: ScenarioExecutionStatus.SUCCESS,
        endedAt: new Date(),
      });

      this.logger.log(`✓ "${scenario.name}" (${scenarioId}) — успешно`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`✗ "${scenario.name}" (${scenarioId}): ${msg}`);

      try {
        await this.executionService.update(executionId, {
          status: ScenarioExecutionStatus.FAILURE,
          errorMessage: msg.slice(0, 2000),
          endedAt: new Date(),
        });
      } catch {
      }
    } finally {
      this.concurrencyGuard.release(scenarioId);
    }
  }

  private parseDefinition(scenario: ScenarioDocument): ScenarioDefinition {
    const result = scenarioDefinitionSchema.safeParse(scenario.definition);
    if (!result.success) {
      throw new BadRequestException(
        `Некорректное определение сценария: ${result.error.message}`,
      );
    }
    return result.data;
  }

  private toIdStr(scenario: ScenarioDocument): string {
    return (scenario._id as Types.ObjectId).toHexString();
  }
}
