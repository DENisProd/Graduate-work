import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { UserId } from '../common/decorators/user-id.decorator';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ScenarioEngineService } from './scenario-engine.service';
import { idParamSchema } from '../common/schemas/id-params';

@ApiTags('Scenario Engine')
@Controller()
export class ScenarioEngineController {
  constructor(private readonly engine: ScenarioEngineService) {}

  @Post('scenarios/:id/trigger')
  @HttpCode(202)
  @ApiOperation({ summary: 'Запустить сценарий вручную (MANUAL trigger)' })
  @ApiParam({ name: 'id', description: 'ObjectId сценария' })
  @ApiResponse({ status: 202, schema: { example: { executionId: 'abc123' } } })
  @ApiResponse({ status: 400, description: 'Сценарий неактивен или занят' })
  @ApiResponse({ status: 404, description: 'Сценарий не найден' })
  triggerManual(
    @Param() params: unknown,
    @UserId() initiatorId: string,
  ) {
    const { id } = idParamSchema.parse(params);
    return this.engine.fireManual(id, initiatorId);
  }

  @Post('scenarios/webhook/:token')
  @HttpCode(202)
  @ApiOperation({ summary: 'Запустить сценарий через webhook-токен' })
  @ApiParam({
    name: 'token',
    description: 'Webhook-токен, указанный в определении сценария',
  })
  @ApiBody({
    required: false,
    schema: { type: 'object', additionalProperties: true },
  })
  @ApiResponse({ status: 202, schema: { example: { executionId: 'abc123' } } })
  @ApiResponse({
    status: 404,
    description: 'Токен не найден или сценарий неактивен',
  })
  triggerWebhook(
    @Param('token') token: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.engine.fireWebhook(token, body);
  }

  @Post('scenario-engine/reload')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Перезагрузить расписание SCHEDULE-триггеров (admin)',
  })
  @ApiResponse({
    status: 200,
    schema: { example: { ok: true } },
  })
  async reloadSchedules() {
    await this.engine.reloadScheduledTriggers();
    return { ok: true };
  }
}
