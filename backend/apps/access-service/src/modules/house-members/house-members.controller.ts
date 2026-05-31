import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { HouseMembersService } from './house-members.service';
import { toHouseMemberResponse, toHouseMemberListItemResponse, toHouseMemberDetailResponse } from './house-members.mapper';
import { HousesService } from '../houses/houses.service';
import { HouseMemberDetailResponseDto, HouseMemberListItemDto, HouseMemberResponseDto } from './dto/house-member-response.dto';
import { UserId } from '../common/decorators/user-id.decorator';

const HOUSE_PAGE_EXAMPLE = {
  type: 'object',
  example: {
    content: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Загородный дом',
        ownerId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        createdAt: '2024-01-01 12:00:00',
        updatedAt: '2024-01-01 12:00:00',
      },
    ],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false,
  },
} as const;

@ApiTags('House Members')
@Controller('house-members')
export class HouseMembersController {
  constructor(
    private readonly houseMembersService: HouseMembersService,
    private readonly housesService: HousesService,
  ) {}

  @Get('house/:houseId')
  @ApiOperation({ summary: 'Получить всех участников дома' })
  @ApiParam({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiQuery({ name: 'page', required: false, example: '0' })
  @ApiQuery({ name: 'size', required: false, example: '20' })
  @ApiQuery({ name: 'sort', required: false, example: 'joinedAt,desc' })
  @ApiOkResponse({ description: 'Только массив участников', type: HouseMemberListItemDto, isArray: true })
  async findByHouseId(
    @Param('houseId') houseId: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('sort') sort = 'joinedAt,desc',
  ) {
    const p = Math.max(0, parseInt(page || '0', 10) || 0);
    const s = Math.max(1, parseInt(size || '20', 10) || 20);
    const { content } = await this.houseMembersService.findByHouseId(houseId, p, s, sort);
    return content.map(toHouseMemberListItemResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить участника по ID' })
  @ApiParam({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: HouseMemberDetailResponseDto })
  async findById(@Param('id') id: string) {
    const data = await this.houseMembersService.findByIdWithAccessDetails(id);
    return toHouseMemberDetailResponse(data);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Добавить участника в дом (только владелец)' })
  @ApiQuery({ name: 'houseId', required: true, example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiQuery({ name: 'userId', required: true, example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' })
  @ApiCreatedResponse({ type: HouseMemberResponseDto })
  async addMember(
    @Query('houseId') houseId: string,
    @Query('userId') userId: string,
    @UserId() callerId: string,
  ) {
    const isOwner = await this.housesService.isOwner(houseId, callerId);
    if (!isOwner) throw new ForbiddenException('Только владелец дома может добавлять участников');
    const member = await this.houseMembersService.addMember(houseId, userId);
    return toHouseMemberResponse(member);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить участника из дома (только владелец)' })
  @ApiQuery({ name: 'houseId', required: true, example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiQuery({ name: 'userId', required: true, example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' })
  @ApiNoContentResponse({ description: 'Участник удалён' })
  async removeMember(
    @Query('houseId') houseId: string,
    @Query('userId') userId: string,
    @UserId() callerId: string,
  ) {
    const isOwner = await this.housesService.isOwner(houseId, callerId);
    if (!isOwner) throw new ForbiddenException('Только владелец дома может удалять участников');
    await this.houseMembersService.removeMember(houseId, userId);
  }
}
