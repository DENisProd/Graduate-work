import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

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
  @ApiOperation({ summary: 'Создать пользователя' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.findOrCreateByExternalUserId(dto.userId, dto.avatarUrl);
    return toResponse(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return toResponse(user);
  }

  @Get('external/:externalUserId')
  @ApiOperation({ summary: 'Получить пользователя по внешнему ID' })
  async findByExternalId(@Param('externalUserId') externalUserId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByExternalUserId(externalUserId);
    return toResponse(user);
  }
}
