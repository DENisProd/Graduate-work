import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessEvaluatorService } from './access-evaluator.service';
import { AccessCheckDto } from './dto/access-check.dto';
import { AccessCheckByDeviceDto } from './dto/access-check-by-device.dto';

@ApiTags('Access Evaluation')
@Controller()
export class AccessEvaluatorController {
  constructor(private readonly accessEvaluatorService: AccessEvaluatorService) {}

  @Post('access/check')
  @ApiOperation({ summary: 'Проверка доступа к ресурсу' })
  async check(@Body() dto: AccessCheckDto) {
    return this.accessEvaluatorService.check(dto);
  }

  @Post('access-check')
  @ApiOperation({ summary: 'Проверка доступа к функции устройства (deviceFunctionId)' })
  async checkByDevice(@Body() dto: AccessCheckByDeviceDto) {
    return this.accessEvaluatorService.checkByDeviceFunction(dto);
  }
}

