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
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AccessControlService } from './access-control.service';
import { HouseAccessRightRequestDto } from './dto/house-access-right-request.dto';
import { AccessCheckRequestDto } from './dto/access-check-request.dto';
import { AccessCheckResponseDto } from './dto/access-check-response.dto';
import { toHouseAccessRightResponse, toHouseAccessRightPageResponse } from './access-control.mapper';
import { UserId } from '../common/decorators/user-id.decorator';
import { HouseAccessRightResponseDto } from './dto/house-access-right-response.dto';

const RIGHTS_PAGE_EXAMPLE = {
  type: 'object',
  description: 'Страница прав (content, page, size, totalElements, …)',
  example: {
    content: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        houseId: '550e8400-e29b-41d4-a716-446655440001',
        houseName: 'Дом',
        accessRightType: 'ALLOW',
        createdAt: '2024-01-01 12:00:00',
        isExpired: false,
        isActive: true,
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

@ApiTags('Access Control')
@Controller('access-control')
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Post('rights')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать право доступа' })
  @ApiCreatedResponse({ type: HouseAccessRightResponseDto })
  async createRight(
    @Body() dto: HouseAccessRightRequestDto,
    @UserId() grantedByUserId: string,
  ): Promise<HouseAccessRightResponseDto> {
    const right = await this.accessControlService.createRight(dto, grantedByUserId);
    return toHouseAccessRightResponse(right);
  }

  @Put('rights/:id')
  @ApiOperation({ summary: 'Обновить право доступа' })
  @ApiParam({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: HouseAccessRightResponseDto })
  async updateRight(
    @Param('id') id: string,
    @Body() dto: HouseAccessRightRequestDto,
    @UserId() userId: string,
  ) {
    const right = await this.accessControlService.updateRight(id, dto, userId);
    return toHouseAccessRightResponse(right);
  }

  @Delete('rights/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить право доступа' })
  @ApiParam({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiNoContentResponse({ description: 'Право удалено' })
  async deleteRight(@Param('id') id: string, @UserId() userId: string) {
    await this.accessControlService.deleteRight(id, userId);
  }

  @Get('rights/member/:memberId')
  @ApiOperation({ summary: 'Получить все права участника' })
  @ApiParam({ name: 'memberId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiQuery({ name: 'page', required: false, example: '0' })
  @ApiQuery({ name: 'size', required: false, example: '20' })
  @ApiQuery({ name: 'sort', required: false, example: 'createdAt,desc' })
  @ApiOkResponse({ schema: RIGHTS_PAGE_EXAMPLE })
  async getRightsByMember(
    @Param('memberId') memberId: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('sort') sort = 'createdAt,desc',
  ) {
    const p = Math.max(0, parseInt(page || '0', 10) || 0);
    const s = Math.max(1, parseInt(size || '20', 10) || 20);
    const { content, total } = await this.accessControlService.findRightsByMemberId(memberId, p, s, sort);
    return toHouseAccessRightPageResponse(content, p, s, total);
  }

  @Get('rights/house/:houseId')
  @ApiOperation({ summary: 'Получить все права дома' })
  @ApiParam({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiQuery({ name: 'page', required: false, example: '0' })
  @ApiQuery({ name: 'size', required: false, example: '20' })
  @ApiQuery({ name: 'sort', required: false, example: 'createdAt,desc' })
  @ApiOkResponse({ schema: RIGHTS_PAGE_EXAMPLE })
  async getRightsByHouse(
    @Param('houseId') houseId: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('sort') sort = 'createdAt,desc',
  ) {
    const p = Math.max(0, parseInt(page || '0', 10) || 0);
    const s = Math.max(1, parseInt(size || '20', 10) || 20);
    const { content, total } = await this.accessControlService.findRightsByHouseId(houseId, p, s, sort);
    return toHouseAccessRightPageResponse(content, p, s, total);
  }

  @Post('check')
  @ApiOperation({ summary: 'Проверить права доступа' })
  @ApiOkResponse({ type: AccessCheckResponseDto })
  async checkAccess(@Body() dto: AccessCheckRequestDto) {
    return this.accessControlService.checkAccess(dto);
  }

  @Post('cleanup/expired')
  @ApiOperation({ summary: 'Очистить истекшие права' })
  @ApiOkResponse({ description: 'Очистка выполнена (HTTP 200, тело пустое)' })
  async cleanupExpired() {
    await this.accessControlService.cleanupExpiredRights();
  }
}
