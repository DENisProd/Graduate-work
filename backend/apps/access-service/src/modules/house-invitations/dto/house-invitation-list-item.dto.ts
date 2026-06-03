import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HousePermission } from '@prisma/client';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class HouseInvitationListItemDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX }) id!: string;
  @ApiPropertyOptional({ example: 'Для мамы / временный доступ / тест' })
  note?: string;
  @ApiProperty({ example: 'a1b2c3d4-token' }) token!: string;
  @ApiProperty({ enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED'] }) status!: string;
  @ApiProperty({ example: '2024-01-01 12:00:00' }) createdAt!: string;
  @ApiPropertyOptional({ example: '2024-01-01 12:00:00' }) acceptedAt?: string;
  @ApiPropertyOptional({ example: '2024-01-01 12:00:00' }) expiresAt?: string;
  @ApiPropertyOptional({ format: 'uuid' }) invitedById?: string;
  @ApiPropertyOptional({ format: 'uuid' }) roleId?: string;
  @ApiPropertyOptional() roleName?: string;
  @ApiPropertyOptional({ enum: HousePermission, isArray: true })
  permissions?: HousePermission[];
}

