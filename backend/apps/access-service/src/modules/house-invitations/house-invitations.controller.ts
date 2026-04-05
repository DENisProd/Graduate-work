import {
  Controller,
  Get,
  Post,
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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { HouseInvitationsService } from './house-invitations.service';
import { HouseInvitationRequestDto } from './dto/house-invitation-request.dto';
import { HouseInvitationResponseDto } from './dto/house-invitation-response.dto';
import { toHouseInvitationResponse, toHouseInvitationPageResponse } from './house-invitations.mapper';
import { UserId } from '../common/decorators/user-id.decorator';

@ApiTags('House Invitations')
@Controller('house-invitations')
export class HouseInvitationsController {
  constructor(private readonly houseInvitationsService: HouseInvitationsService) {}

  @Get('token/:token')
  @ApiOperation({ summary: 'Получить приглашение по токену' })
  @ApiParam({ name: 'token', example: 'invite-secret-token' })
  @ApiOkResponse({ type: HouseInvitationResponseDto })
  async findByToken(@Param('token') token: string) {
    const inv = await this.houseInvitationsService.findByToken(token);
    return toHouseInvitationResponse(inv);
  }

  @Get('house/:houseId')
  @ApiOperation({
    summary: 'Приглашения дома',
    description:
      'По умолчанию возвращаются только ожидающие и ещё действительные приглашения (PENDING, срок не истёк). Принятые и остальные завершённые не включаются. Для полной истории укажите includeAll=true.',
  })
  @ApiParam({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiQuery({ name: 'page', required: false, example: '0' })
  @ApiQuery({ name: 'size', required: false, example: '20' })
  @ApiQuery({ name: 'sort', required: false, example: 'createdAt,desc' })
  @ApiQuery({
    name: 'includeAll',
    required: false,
    example: 'false',
    description: 'Если true — все приглашения по дому (включая принятые, отклонённые и т.д.)',
  })
  @ApiOkResponse({ type: HouseInvitationResponseDto, isArray: true })
  async findByHouseId(
    @Param('houseId') houseId: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('sort') sort = 'createdAt,desc',
    @Query('includeAll') includeAll?: string,
  ) {
    const p = Math.max(0, parseInt(page || '0', 10) || 0);
    const s = Math.max(1, parseInt(size || '20', 10) || 20);
    const all = includeAll === 'true' || includeAll === '1';
    const { content, total } = await this.houseInvitationsService.findByHouseId(houseId, p, s, sort, all);
    const pageResponse = toHouseInvitationPageResponse(content, p, s, total);
    return pageResponse.content;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать приглашение' })
  @ApiCreatedResponse({ type: HouseInvitationResponseDto })
  async create(@Body() dto: HouseInvitationRequestDto, @UserId() invitedById: string) {
    const inv = await this.houseInvitationsService.create(dto, invitedById);
    return toHouseInvitationResponse(inv);
  }

  @Post(':token/accept')
  @ApiOperation({ summary: 'Принять приглашение' })
  @ApiParam({ name: 'token', example: 'invite-secret-token' })
  @ApiOkResponse({ type: HouseInvitationResponseDto })
  async accept(@Param('token') token: string, @UserId() userId: string) {
    const inv = await this.houseInvitationsService.accept(token, userId);
    return toHouseInvitationResponse(inv);
  }

  @Post(':token/decline')
  @ApiOperation({ summary: 'Отклонить приглашение' })
  @ApiParam({ name: 'token', example: 'invite-secret-token' })
  @ApiOkResponse({ type: HouseInvitationResponseDto })
  async decline(@Param('token') token: string) {
    const inv = await this.houseInvitationsService.decline(token);
    return toHouseInvitationResponse(inv);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Отозвать приглашение' })
  @ApiParam({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: HouseInvitationResponseDto })
  async revoke(@Param('id') id: string, @UserId() userId: string) {
    const inv = await this.houseInvitationsService.revoke(id, userId);
    return toHouseInvitationResponse(inv);
  }
}
