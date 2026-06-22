import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserId } from '../common/decorators/user-id.decorator';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessEvaluatorService } from './access-evaluator.service';
import { AccessCheckDto } from './dto/access-check.dto';
import { AccessCheckByDeviceDto } from './dto/access-check-by-device.dto';
import { AccessDecisionResponseDto } from './dto/access-decision-response.dto';
import { DeviceAccessCheckResponseDto } from './dto/device-access-check-response.dto';

@ApiTags('Access Evaluation')
@Controller()
export class AccessEvaluatorController {
  constructor(private readonly accessEvaluatorService: AccessEvaluatorService) {}

  @Post('access/check')
  @ApiOperation({
    summary: 'Проверка доступа к ресурсу',
    description: 'Оценка по цепочке ресурса: эффективные права → явные права → политики ABAC.',
  })
  @ApiBody({ type: AccessCheckDto })
  @ApiOkResponse({ type: AccessDecisionResponseDto })
  async check(@Body() dto: AccessCheckDto, @UserId() userId: string): Promise<AccessDecisionResponseDto> {
    return this.accessEvaluatorService.check({ ...dto, userId });
  }

  @Post('access-check')
  @ApiOperation({
    summary: 'Проверка доступа к функции устройства',
    description: 'По `deviceFunctionId` находится ресурс типа DEVICE_FUNCTION, затем выполняется та же проверка, что и для `access/check`.',
  })
  @ApiBody({ type: AccessCheckByDeviceDto })
  @ApiOkResponse({ type: DeviceAccessCheckResponseDto })
  async checkByDevice(@Body() dto: AccessCheckByDeviceDto, @UserId() userId: string): Promise<DeviceAccessCheckResponseDto> {
    return this.accessEvaluatorService.checkByDeviceFunction({ ...dto, userId });
  }

  @Get('houses/:houseId/page-access')
  @ApiOperation({
    summary: 'Доступ текущего пользователя к страницам дома',
    description: 'Для каждой PAGE-ресурса (slug) возвращает флаги read/write по цепочке RBAC/ABAC.',
  })
  async getPageAccess(@Param('houseId') houseId: string, @UserId() userId: string) {
    return this.accessEvaluatorService.getPageAccess(houseId, userId);
  }

  @Get('houses/:houseId/function-access')
  @ApiOperation({
    summary: 'Доступ текущего пользователя к функциям устройств дома',
    description:
      'Ключ — externalId функции (например fn:demo-corridor-light:power). Значение — флаги read/write.',
  })
  async getFunctionAccess(@Param('houseId') houseId: string, @UserId() userId: string) {
    return this.accessEvaluatorService.getFunctionAccess(houseId, userId);
  }
}

