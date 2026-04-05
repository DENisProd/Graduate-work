import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
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
import { HouseRolesService } from './house-roles.service';
import { CreateHouseRoleRequestDto, HouseRoleResponseDto } from './dto/house-role.dto';
import { UserId } from '../common/decorators/user-id.decorator';

@ApiTags('House Roles')
@Controller('house-roles')
export class HouseRolesController {
  constructor(private readonly houseRolesService: HouseRolesService) {}

  @Get('house/:houseId')
  @ApiOperation({ summary: 'Список ролей дома' })
  @ApiParam({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ type: HouseRoleResponseDto, isArray: true })
  async findByHouseId(@Param('houseId') houseId: string): Promise<HouseRoleResponseDto[]> {
    const roles = await this.houseRolesService.findByHouseId(houseId);
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      houseId: r.houseId,
      priority: r.priority,
      isSystem: r.isSystem,
      permissions: r.permissions.map((p) => p.permission),
    }));
  }

  @Post('house/:houseId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать кастомную роль' })
  @ApiParam({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiCreatedResponse({ type: HouseRoleResponseDto })
  async create(
    @Param('houseId') houseId: string,
    @Body() dto: CreateHouseRoleRequestDto,
    @UserId() editorUserId: string,
  ): Promise<HouseRoleResponseDto> {
    const role = await this.houseRolesService.createCustomRole(houseId, dto.name, dto.priority, editorUserId);
    return {
      id: role.id,
      name: role.name,
      houseId: role.houseId,
      priority: role.priority,
      isSystem: role.isSystem,
      permissions: role.permissions.map((p) => p.permission),
    };
  }

  @Delete(':roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить роль (системные удалять нельзя)' })
  @ApiParam({ name: 'roleId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiNoContentResponse({ description: 'Роль удалена' })
  async delete(@Param('roleId') roleId: string): Promise<void> {
    await this.houseRolesService.deleteRole(roleId);
  }

  @Post('members/:memberId/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Назначить роль участнику' })
  @ApiParam({ name: 'memberId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiParam({ name: 'roleId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' })
  @ApiNoContentResponse({ description: 'Роль назначена' })
  async assignRole(
    @Param('memberId') memberId: string,
    @Param('roleId') roleId: string,
    @UserId() editorUserId: string,
  ): Promise<void> {
    await this.houseRolesService.assignRoleToMember(memberId, roleId, editorUserId);
  }

  @Delete('members/:memberId/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Снять роль с участника' })
  @ApiParam({ name: 'memberId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiParam({ name: 'roleId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' })
  @ApiNoContentResponse({ description: 'Роль снята' })
  async unassignRole(
    @Param('memberId') memberId: string,
    @Param('roleId') roleId: string,
    @UserId() editorUserId: string,
  ): Promise<void> {
    await this.houseRolesService.unassignRoleFromMember(memberId, roleId, editorUserId);
  }
}
