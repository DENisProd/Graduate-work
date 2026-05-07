import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DeviceFunctionActionsService } from './device-function-actions.service';
import { DeviceFunctionActionResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';

@ApiTags('Device function actions')
@Controller('device-function-actions')
export class DeviceFunctionActionsController {
  constructor(private readonly service: DeviceFunctionActionsService) {}

  @Get('by-function/:functionId/all')
  @ApiOperation({ summary: 'Все действия функции' })
  @ApiParam({ name: 'functionId', description: 'ID функции устройства' })
  @ApiOkResponse({ description: 'Массив действий' })
  findAllByFunctionId(
    @Param('functionId') functionId: string,
  ): Promise<DeviceFunctionActionResponse[]> {
    return this.service.findByFunctionId(Number(functionId));
  }

  @Get('by-function/:functionId')
  @ApiOperation({ summary: 'Действия функции (постранично)' })
  @ApiParam({ name: 'functionId', description: 'ID функции устройства' })
  @ApiQuery({ name: 'page', required: false, example: 0 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  @ApiOkResponse({ description: 'Страница действий', type: PageResponse })
  findByFunctionId(
    @Param('functionId') functionId: string,
    @Query('page') page = 0,
    @Query('size') size = 20,
  ): Promise<PageResponse<DeviceFunctionActionResponse>> {
    const p = Number(page) || 0;
    const s = Number(size) || 20;
    return this.service.findByFunctionIdPaged(Number(functionId), p, s);
  }

  @Get('by-device/:deviceId/all')
  @ApiOperation({ summary: 'Все действия по устройству' })
  @ApiParam({ name: 'deviceId', description: 'ID устройства' })
  @ApiOkResponse({ description: 'Массив действий' })
  findAllByDeviceId(
    @Param('deviceId') deviceId: string,
  ): Promise<DeviceFunctionActionResponse[]> {
    return this.service.findByDeviceId(Number(deviceId));
  }

  @Get('by-device/:deviceId')
  @ApiOperation({ summary: 'Действия по устройству (постранично)' })
  @ApiParam({ name: 'deviceId', description: 'ID устройства' })
  @ApiQuery({ name: 'page', required: false, example: 0 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  @ApiOkResponse({ description: 'Страница действий', type: PageResponse })
  findByDeviceId(
    @Param('deviceId') deviceId: string,
    @Query('page') page = 0,
    @Query('size') size = 20,
  ): Promise<PageResponse<DeviceFunctionActionResponse>> {
    const p = Number(page) || 0;
    const s = Number(size) || 20;
    return this.service.findByDeviceIdPaged(Number(deviceId), p, s);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Действие по ID' })
  @ApiParam({ name: 'id', description: 'ID действия' })
  @ApiOkResponse({ description: 'Действие' })
  findById(@Param('id') id: string): Promise<DeviceFunctionActionResponse> {
    return this.service.findById(Number(id));
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Выполнить действие' })
  @ApiParam({ name: 'id', description: 'ID действия' })
  @ApiOkResponse({ description: 'Действие после выполнения' })
  execute(@Param('id') id: string): Promise<DeviceFunctionActionResponse> {
    return this.service.execute(Number(id));
  }
}
