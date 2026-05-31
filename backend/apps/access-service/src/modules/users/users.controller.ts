import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserId } from '../common/decorators/user-id.decorator';

function toResponse(u: { id: string; externalUserId: string; avatarUrl: string | null; createdAt: Date }): UserResponseDto {
  return {
    id: u.id,
    externalUserId: u.externalUserId,
    avatarUrl: u.avatarUrl ?? undefined,
    createdAt: u.createdAt.toISOString(),
  };
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать или найти пользователя',
    description: 'Идемпотентно по `userId`: при существующем внешнем ID возвращается существующая запись.',
  })
  @ApiCreatedResponse({ type: UserResponseDto, description: 'Пользователь создан или найден' })
  async create(@Body() dto: CreateUserDto, @UserId() userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOrCreateByExternalUserId(userId, dto.avatarUrl);
    return toResponse(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по внутреннему ID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID записи в сервисе' })
  @ApiOkResponse({ type: UserResponseDto })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return toResponse(user);
  }

  @Get('external/:externalUserId')
  @ApiOperation({ summary: 'Получить пользователя по внешнему ID (userId)' })
  @ApiParam({ name: 'externalUserId', description: 'Внешний идентификатор пользователя' })
  @ApiOkResponse({ type: UserResponseDto })
  async findByExternalId(@Param('externalUserId') externalUserId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByExternalUserId(externalUserId);
    return toResponse(user);
  }
}
