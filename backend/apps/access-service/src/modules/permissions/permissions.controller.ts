import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiAcceptedResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AccessRightType, ResourceType } from '@prisma/client';
import { PermissionsService } from './permissions.service';
import { CreateAccessRightDto } from './dto/create-access-right.dto';
import { AccessRightResponseDto } from './dto/access-right-response.dto';
import { AccessStructureResponseDto } from './dto/access-structure-response.dto';
import { UserId } from '../common/decorators/user-id.decorator';

const toResponse = (r: {
  id: string;
  resourceId: string;
  houseMemberId: string | null;
  roleId: string | null;
  accessRightType: AccessRightType;
  parameters: unknown | null;
  expiresAt: Date | null;
  createdAt: Date;
  resource?: {
    type: ResourceType;
    depth: number;
  };
}): AccessRightResponseDto => ({
  id: r.id,
  resourceId: r.resourceId,
  houseMemberId: r.houseMemberId ?? undefined,
  roleId: r.roleId ?? undefined,
  accessRightType: r.accessRightType,
  parameters: (r.parameters as Record<string, unknown> | null) ?? undefined,
  expiresAt: r.expiresAt ? r.expiresAt.toISOString() : undefined,
  createdAt: r.createdAt.toISOString(),
  resource: r.resource ? { type: r.resource.type, depth: r.resource.depth } : undefined,
});

@ApiTags('Access Rights')
@Controller()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post('access-rights')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Назначить право доступа ресурсу (RBAC)',
    description: 'Требуется X-User-Id — кто выдал право.',
  })
  @ApiBody({ type: CreateAccessRightDto })
  @ApiCreatedResponse({ type: AccessRightResponseDto })
  async create(
    @Body() dto: CreateAccessRightDto,
    @UserId() grantedByUserId: string,
  ): Promise<AccessRightResponseDto> {
    const right = await this.permissionsService.create(dto, grantedByUserId);
    return toResponse(right);
  }

  @Get('resources/:id/permissions')
  @ApiOperation({ summary: 'Получить права доступа ресурса' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID ресурса' })
  @ApiOkResponse({ type: AccessRightResponseDto, isArray: true })
  async getByResource(
    @Param('id') resourceId: string,
  ): Promise<AccessRightResponseDto[]> {
    const rights = await this.permissionsService.findByResourceId(resourceId);
    return rights.map(toResponse);
  }

  @Get('access-rights/user/:id')
  @ApiOperation({
    summary: 'Права доступа пользователя',
    description: 'Включая права, выданные через роли участника.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Внутренний ID пользователя в сервисе' })
  @ApiOkResponse({ type: AccessRightResponseDto, isArray: true })
  async getByUser(@Param('id') id: string): Promise<AccessRightResponseDto[]> {
    const rights = await this.permissionsService.findByUserId(id);
    return rights.map(toResponse);
  }

  @Delete('access-rights/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить право доступа' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Право удалено' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.permissionsService.delete(id);
  }

  @Post('permissions/rebuild')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Пересчитать кэш эффективных прав' })
  @ApiAcceptedResponse({ description: 'Пересчёт запущен или завершён (тело пустое)' })
  async rebuildCache(): Promise<void> {
    await this.permissionsService.rebuildCache();
  }

  @Get('access-structure')
  @ApiOperation({
    summary: 'Структура доступа пользователя',
    description: 'Дома, комнаты, устройства и функции с учётом эффективных прав.',
  })
  @ApiQuery({ name: 'userId', required: true, description: 'Внутренний ID пользователя в сервисе' })
  @ApiOkResponse({ type: AccessStructureResponseDto })
  async getAccessStructure(@Query('userId') userId: string): Promise<AccessStructureResponseDto> {
    return this.permissionsService.getAccessStructure(userId);
  }
}


