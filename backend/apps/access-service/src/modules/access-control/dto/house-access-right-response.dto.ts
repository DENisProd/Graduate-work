import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HouseAccessRightResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) houseId!: string;
  @ApiProperty() houseName!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  houseMemberId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  houseRoleId?: string;

  @ApiPropertyOptional()
  houseRoleName?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  userId?: string;

  @ApiPropertyOptional()
  userName?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  deviceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  deviceFunctionId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  houseRoomId?: string;

  @ApiPropertyOptional()
  houseRoomName?: string;

  @ApiProperty({ enum: ['ALLOW', 'DENY', 'READ', 'WRITE'] }) accessRightType!: string;
  @ApiPropertyOptional() parameters?: Record<string, string>;
  @ApiProperty({ example: '2024-01-01 12:00:00' }) createdAt!: string;
  @ApiPropertyOptional({ format: 'uuid' }) grantedById?: string;
  @ApiPropertyOptional() grantedByName?: string;
  @ApiPropertyOptional({ example: '2024-01-01 12:00:00' }) expiresAt?: string;
  @ApiProperty() isExpired!: boolean;
  @ApiProperty() isActive!: boolean;
}
