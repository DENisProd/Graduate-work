import { Body, Controller, Post } from '@nestjs/common';
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
}

