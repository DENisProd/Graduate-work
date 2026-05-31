import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserId } from '../common/decorators/user-id.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { HousesService } from './houses.service';
import { HouseRolesService } from '../house-roles/house-roles.service';
import { HouseRequestDto } from './dto/house-request.dto';
import { HouseUpdateRequestDto } from './dto/house-update-request.dto';
import { HouseResponseDto } from './dto/house-response.dto';
import { toHouseResponse, toHousePageResponse } from './houses.mapper';

@ApiTags('Houses')
@Controller('houses')
export class HousesController {
  constructor(
    private readonly housesService: HousesService,
    private readonly houseRolesService: HouseRolesService,
  ) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Дома пользователя (владелец или участник), внешний userId' })
  @ApiParam({ name: 'userId', format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' })
  @ApiQuery({ name: 'page', required: false, example: '0' })
  @ApiQuery({ name: 'size', required: false, example: '20' })
  @ApiQuery({ name: 'sort', required: false, example: 'createdAt,desc' })
  @ApiOkResponse({ description: 'Только массив домов', type: HouseResponseDto, isArray: true })
  async findByUserId(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('sort') sort = 'createdAt,desc',
  ) {
    const p = Math.max(0, parseInt(page || '0', 10) || 0);
    const s = Math.max(1, parseInt(size || '20', 10) || 20);
    const { content, total } = await this.housesService.findByOwnerId(userId, p, s, sort);
    const pageResponse = toHousePageResponse(content, p, s, total);
    return pageResponse.content;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить дом по ID' })
  @ApiParam({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: HouseResponseDto })
  async findById(@Param('id') id: string) {
    const house = await this.housesService.findById(id);
    return toHouseResponse(house);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать дом' })
  @ApiCreatedResponse({ type: HouseResponseDto })
  async create(@Body() dto: HouseRequestDto, @UserId() userId: string) {
    const house = await this.housesService.create(dto, userId);
    return toHouseResponse(house);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить дом' })
  @ApiParam({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: HouseResponseDto })
  async update(@Param('id') id: string, @Body() dto: HouseUpdateRequestDto) {
    const house = await this.housesService.update(id, dto);
    return toHouseResponse(house);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить дом' })
  @ApiParam({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiNoContentResponse({ description: 'Дом удалён' })
  async delete(@Param('id') id: string) {
    await this.housesService.delete(id);
  }
}
