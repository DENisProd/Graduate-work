import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiParam,
} from '@nestjs/swagger';
import { HouseRoomsService } from './house-rooms.service';
import { HouseRoomRequestDto } from './dto/house-room-request.dto';
import { HouseRoomResponseDto } from './dto/house-room-response.dto';
import { toHouseRoomResponse, toHouseRoomResponseList } from './house-rooms.mapper';

@ApiTags('House Rooms')
@Controller('house-rooms')
export class HouseRoomsController {
  constructor(private readonly houseRoomsService: HouseRoomsService) {}

  @Get('house/:houseId')
  @ApiOperation({ summary: 'Получить все комнаты дома' })
  @ApiParam({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: HouseRoomResponseDto, isArray: true })
  async findByHouseId(@Param('houseId') houseId: string) {
    const rooms = await this.houseRoomsService.findByHouseId(houseId);
    return toHouseRoomResponseList(rooms);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить комнату по ID' })
  @ApiParam({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: HouseRoomResponseDto })
  async findById(@Param('id') id: string) {
    const room = await this.houseRoomsService.findById(id);
    return toHouseRoomResponse(room);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать комнату' })
  @ApiCreatedResponse({ type: HouseRoomResponseDto })
  async create(@Body() dto: HouseRoomRequestDto) {
    const room = await this.houseRoomsService.create(dto);
    return toHouseRoomResponse(room);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить комнату' })
  @ApiParam({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: HouseRoomResponseDto })
  async update(@Param('id') id: string, @Body() dto: HouseRoomRequestDto) {
    const room = await this.houseRoomsService.update(id, dto);
    return toHouseRoomResponse(room);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить комнату' })
  @ApiParam({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiNoContentResponse({ description: 'Комната удалена' })
  async delete(@Param('id') id: string) {
    await this.houseRoomsService.delete(id);
  }
}
