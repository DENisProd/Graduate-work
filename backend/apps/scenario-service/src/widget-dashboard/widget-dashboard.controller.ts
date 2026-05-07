import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { WidgetDashboardService } from './widget-dashboard.service';

@ApiTags('Widget Dashboards')
@Controller('widget-dashboards')
export class WidgetDashboardController {
  constructor(private readonly service: WidgetDashboardService) {}

  @Post()
  @ApiOperation({ summary: 'Создать дашборд виджетов' })
  create(
    @Body()
    body: {
      houseId: string;
      userId: string;
      name: string;
      isDefault?: boolean;
      layouts?: Record<string, unknown>;
      widgets?: unknown[];
    },
  ) {
    return this.service.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Список дашбордов дома' })
  @ApiQuery({ name: 'houseId', required: true, type: String })
  findByHouse(@Query('houseId') houseId: string) {
    return this.service.findByHouse(houseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить дашборд по ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить дашборд (layout + widgets)' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      isDefault?: boolean;
      layouts?: Record<string, unknown>;
      widgets?: unknown[];
    },
  ) {
    return this.service.update(id, body);
  }

  @Patch(':id/layout')
  @ApiOperation({ summary: 'Обновить только layout (autosave при drag&drop)' })
  @ApiParam({ name: 'id' })
  updateLayout(
    @Param('id') id: string,
    @Body() body: { layouts: Record<string, unknown> },
  ) {
    return this.service.updateLayout(id, body.layouts);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить дашборд' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
