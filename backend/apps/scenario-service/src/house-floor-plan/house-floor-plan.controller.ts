import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Logger,
  Param,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  HouseFloorPlanService,
} from './house-floor-plan.service';
import type { FloorPlanSnapshot } from './house-floor-plan.repository';

@ApiTags('House Floor Plans')
@Controller('house-floor-plans')
export class HouseFloorPlanController {
  private readonly logger = new Logger(HouseFloorPlanController.name);

  constructor(private readonly service: HouseFloorPlanService) {}

  @Get(':houseId')
  @ApiOperation({ summary: 'Получить планировку дома' })
  @ApiParam({ name: 'houseId' })
  get(@Param('houseId') houseId: string) {
    this.logger.log(`GET /house-floor-plans/${houseId}`);
    return this.service.getByHouseId(houseId);
  }

  @Put(':houseId')
  @ApiOperation({ summary: 'Сохранить планировку дома (upsert)' })
  @ApiParam({ name: 'houseId' })
  upsert(
    @Param('houseId') houseId: string,
    @Body() body: { snapshot: FloorPlanSnapshot; version?: number },
    @Headers('x-user-id') userId?: string,
  ) {
    this.logger.log(
      `PUT /house-floor-plans/${houseId} version=${body.version ?? 'new'}`,
    );
    return this.service.upsert(
      houseId,
      body.snapshot,
      body.version,
      userId?.trim() || undefined,
    );
  }

  @Delete(':houseId')
  @ApiOperation({ summary: 'Удалить планировку дома' })
  @ApiParam({ name: 'houseId' })
  delete(@Param('houseId') houseId: string) {
    this.logger.log(`DELETE /house-floor-plans/${houseId}`);
    return this.service.delete(houseId);
  }
}
