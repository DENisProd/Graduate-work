import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DeviceFunctionActionsService } from '../device-function-actions/device-function-actions.service';
import { DeviceFunctionActionResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceFunctionActionRequest } from '../devices/dto/device-function-action-request.dto';

@ApiTags('Admin — device function actions')
@Controller('api/v1/admin/device-function-actions')
export class AdminDeviceFunctionActionsController {
  constructor(private readonly service: DeviceFunctionActionsService) {}

  @Get('by-function/:functionId/all')
  @ApiOperation({ summary: 'Все действия функции (админ)' })
  @ApiParam({ name: 'functionId', description: 'ID функции' })
  @ApiOkResponse({ description: 'Массив действий' })
  findAllByFunctionId(
    @Param('functionId') functionId: string,
  ): Promise<DeviceFunctionActionResponse[]> {
    return this.service.findByFunctionId(Number(functionId));
  }

  @Get('by-function/:functionId')
  @ApiOperation({ summary: 'Действия функции (админ, постранично)' })
  @ApiParam({ name: 'functionId', description: 'ID функции' })
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
  @ApiOperation({ summary: 'Все действия по устройству (админ)' })
  @ApiParam({ name: 'deviceId', description: 'ID устройства' })
  @ApiOkResponse({ description: 'Массив действий' })
  findAllByDeviceId(
    @Param('deviceId') deviceId: string,
  ): Promise<DeviceFunctionActionResponse[]> {
    return this.service.findByDeviceId(Number(deviceId));
  }

  @Get('by-device/:deviceId')
  @ApiOperation({ summary: 'Действия по устройству (админ, постранично)' })
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
  @ApiOperation({ summary: 'Действие по ID (админ)' })
  @ApiParam({ name: 'id', description: 'ID действия' })
  @ApiOkResponse({ description: 'Действие' })
  findById(@Param('id') id: string): Promise<DeviceFunctionActionResponse> {
    return this.service.findById(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Создать действие функции' })
  @ApiBody({ type: DeviceFunctionActionRequest })
  @ApiOkResponse({ description: 'Созданное действие' })
  create(@Body() body: DeviceFunctionActionRequest): Promise<DeviceFunctionActionResponse> {
    return this.service.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить действие функции' })
  @ApiParam({ name: 'id', description: 'ID действия' })
  @ApiBody({ type: DeviceFunctionActionRequest })
  @ApiOkResponse({ description: 'Обновлённое действие' })
  update(
    @Param('id') id: string,
    @Body() body: DeviceFunctionActionRequest,
  ): Promise<DeviceFunctionActionResponse> {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить действие функции' })
  @ApiParam({ name: 'id', description: 'ID действия' })
  @ApiResponse({ status: 200, description: 'Удалено' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.delete(Number(id));
  }
}
