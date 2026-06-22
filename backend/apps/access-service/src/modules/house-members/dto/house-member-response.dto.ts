import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HouseAccessRightResponseDto } from '../../access-control/dto/house-access-right-response.dto';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class HouseMemberRoleBriefDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX }) memberRoleId!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EX }) roleId!: string;
  @ApiProperty({ example: 'Админ' }) name!: string;
  @ApiProperty({ example: 2 }) priority!: number;
  @ApiProperty({ example: true }) isSystem!: boolean;
  @ApiProperty({
    type: [String],
    enum: ['INVITE_MEMBERS', 'EDIT_ROLES', 'MANAGE_DEVICES', 'MANAGE_AUTOMATIONS'],
  })
  permissions!: string[];
  @ApiPropertyOptional({ example: 3, description: 'Число прав на ресурсы, назначенных роли' })
  accessRightsCount?: number;
  @ApiProperty({ example: '2024-01-01 12:00:00' }) assignedAt!: string;
}

export class MemberEffectivePermissionDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX }) resourceId!: string;
  @ApiProperty({
    enum: ['HOUSE', 'ROOM', 'DEVICE', 'DEVICE_FUNCTION', 'SCENE', 'GROUP', 'AUTOMATION'],
  })
  resourceType!: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() externalId?: string;
  @ApiProperty({ example: '/house/...' }) path!: string;
  @ApiProperty({ enum: ['ALLOW', 'DENY', 'READ', 'WRITE'] }) accessRightType!: string;
  @ApiProperty({ enum: ['ROLE', 'DIRECT', 'POLICY'] }) sourceType!: string;
  @ApiPropertyOptional({ format: 'uuid' }) sourceId?: string;
  @ApiPropertyOptional({ example: '2024-01-01 12:00:00' }) expiresAt?: string;
}

/** Участник в списке по дому: без houseId/houseName (дом известен из пути). */
export class HouseMemberListItemDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX }) id!: string;
  @ApiProperty({ format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }) userId!: string;
  @ApiPropertyOptional({ example: 'Иван Петров' }) userDisplayName?: string;
  @ApiPropertyOptional({ example: 'https://cdn.example/avatar.png' }) userAvatarUrl?: string;
  @ApiProperty({ example: '2024-01-01 12:00:00' }) joinedAt!: string;
  @ApiProperty({ type: [HouseMemberRoleBriefDto], description: 'Назначенные роли участника в доме' })
  roles!: HouseMemberRoleBriefDto[];
}

export class HouseMemberResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX }) id!: string;
  @ApiProperty({ format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }) userId!: string;
  @ApiPropertyOptional({ example: 'Иван Петров' }) userDisplayName?: string;
  @ApiPropertyOptional({ example: 'https://cdn.example/avatar.png' }) userAvatarUrl?: string;
  @ApiProperty({ format: 'uuid', example: UUID_EX }) houseId!: string;
  @ApiProperty({ example: 'Мой дом' }) houseName!: string;
  @ApiProperty({ example: '2024-01-01 12:00:00' }) joinedAt!: string;
  @ApiProperty({ type: [HouseMemberRoleBriefDto], description: 'Назначенные роли участника в доме' })
  roles!: HouseMemberRoleBriefDto[];
}

export class HouseMemberDetailResponseDto extends HouseMemberResponseDto {
  @ApiProperty({
    type: [MemberEffectivePermissionDto],
    description: 'Итоговые права по ресурсам (кэш effective permissions)',
  })
  effectivePermissions!: MemberEffectivePermissionDto[];

  @ApiProperty({
    type: [HouseAccessRightResponseDto],
    description: 'Прямые права участника (не через роль)',
  })
  directAccessRights!: HouseAccessRightResponseDto[];
}
