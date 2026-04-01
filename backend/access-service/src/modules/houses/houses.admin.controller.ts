import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { HousesService } from './houses.service';
import { HouseResponseDto } from './dto/house-response.dto';
import { toHousePageResponse } from './houses.mapper';

@ApiTags('Admin Houses')
@Controller('admin/houses')
export class HousesAdminController {
  constructor(private readonly housesService: HousesService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все дома (Админ)' })
  @ApiQuery({ name: 'page', required: false, example: '0' })
  @ApiQuery({ name: 'size', required: false, example: '20' })
  @ApiQuery({ name: 'sort', required: false, example: 'createdAt,desc' })
  @ApiOkResponse({
    description: 'Массив домов',
    type: HouseResponseDto,
    isArray: true,
  })
  async findAll(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('sort') sort = 'createdAt,desc',
  ) {
    const p = Math.max(0, parseInt(page || '0', 10) || 0);
    const s = Math.max(1, parseInt(size || '20', 10) || 20);
    const { content, total } = await this.housesService.findAll(p, s, sort);
    const pageResponse = toHousePageResponse(content, p, s, total);
    return pageResponse.content;
  }

  @Get('owner/:ownerId')
  @ApiOperation({ summary: 'Получить все дома владельца' })
  @ApiParam({ name: 'ownerId', format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' })
  @ApiQuery({ name: 'page', required: false, example: '0' })
  @ApiQuery({ name: 'size', required: false, example: '20' })
  @ApiQuery({ name: 'sort', required: false, example: 'createdAt,desc' })
  @ApiOkResponse({ description: 'Только массив домов', type: HouseResponseDto, isArray: true })
  async findByOwnerId(
    @Param('ownerId') ownerId: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('sort') sort = 'createdAt,desc',
  ) {
    const p = Math.max(0, parseInt(page || '0', 10) || 0);
    const s = Math.max(1, parseInt(size || '20', 10) || 20);
    const { content, total } = await this.housesService.findByOwnerId(ownerId, p, s, sort);
    const pageResponse = toHousePageResponse(content, p, s, total);
    return pageResponse.content;
  }
}

