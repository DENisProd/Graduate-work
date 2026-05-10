import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { dashboardOverviewQuerySchema } from './dashboard.schemas';
import {
  DashboardService,
  type DashboardOverviewResponse,
} from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Агрегаты для dashboard по списку домов (без глобальных данных)',
  })
  @ApiQuery({
    name: 'houseId',
    required: true,
    type: String,
    isArray: true,
    description:
      'ID домов. Можно передавать как повторяющийся query-param: houseId=h1&houseId=h2',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description:
      'ISO date: начало периода для событий (по умолчанию последние 24ч)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Сколько последних событий вернуть (1..100, default 5)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview',
  })
  async getOverview(
    @Query() query: unknown,
  ): Promise<DashboardOverviewResponse> {
    const q = dashboardOverviewQuerySchema.parse(query);
    return this.dashboard.getOverview({
      houseIds: q.houseId,
      from: q.from,
      limit: q.limit,
    });
  }
}

