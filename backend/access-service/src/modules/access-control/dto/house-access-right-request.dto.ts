import { IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessRightType } from '@prisma/client';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class HouseAccessRightRequestDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX, description: 'ID ресурса (устройство, комната и т.д.)' })
  @IsNotEmpty({ message: 'ID ресурса обязателен' })
  @IsUUID()
  resourceId!: string;

  @ApiPropertyOptional({ format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' })
  @IsOptional()
  @IsUUID()
  houseMemberId?: string;

  @ApiPropertyOptional({ format: 'uuid', example: '7ba7b810-9dad-11d1-80b4-00c04fd430c8' })
  @IsOptional()
  @IsUUID()
  houseRoleId?: string;

  @ApiProperty({ enum: ['ALLOW', 'DENY', 'READ', 'WRITE'], example: 'ALLOW' })
  @IsEnum(['ALLOW', 'DENY', 'READ', 'WRITE'], { message: 'Тип права доступа обязателен' })
  accessRightType!: AccessRightType;

  @ApiPropertyOptional()
  @IsOptional()
  parameters?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;
}
