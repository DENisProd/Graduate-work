import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessRightType, ResourceType } from '@prisma/client';

export class AccessRightResourceDto {
  @ApiProperty({ enum: ResourceType })
  type!: ResourceType;

  @ApiProperty()
  depth!: number;
}

export class AccessRightResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  houseMemberId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  roleId?: string;

  @ApiProperty({ enum: AccessRightType })
  accessRightType!: AccessRightType;

  @ApiPropertyOptional()
  parameters?: Record<string, unknown>;

  @ApiPropertyOptional()
  expiresAt?: string;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional({ type: AccessRightResourceDto })
  resource?: AccessRightResourceDto;
}

