import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HousePermission } from '@prisma/client';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class HouseInvitationResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX }) id!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EX }) houseId!: string;
  @ApiProperty({ example: 'Мой дом' }) houseName!: string;
  @ApiProperty({ example: 'guest@example.com' }) email!: string;
  @ApiProperty({ example: 'a1b2c3d4-token' }) token!: string;
  @ApiProperty({ enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED'] }) status!: string;
  @ApiProperty({ example: '2024-01-01 12:00:00' }) createdAt!: string;
  @ApiPropertyOptional({ example: '2024-01-01 12:00:00' }) acceptedAt?: string;
  @ApiPropertyOptional({ example: '2024-01-01 12:00:00' }) expiresAt?: string;
  @ApiPropertyOptional({ format: 'uuid' }) invitedById?: string;
  @ApiPropertyOptional({ format: 'uuid', description: 'Выбранная роль при создании приглашения' }) roleId?: string;
  @ApiPropertyOptional({ description: 'Имя роли, если указан roleId' }) roleName?: string;
  @ApiPropertyOptional({ enum: HousePermission, isArray: true, description: 'Права: у выбранной роли или явный список до принятия' })
  permissions?: HousePermission[];
}
