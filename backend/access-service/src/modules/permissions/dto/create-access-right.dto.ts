import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessRightType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateAccessRightDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  resourceId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'ID участника дома' })
  @IsUUID()
  @IsOptional()
  houseMemberId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'ID роли дома' })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiProperty({ enum: AccessRightType })
  @IsEnum(AccessRightType)
  accessRightType!: AccessRightType;

  @ApiPropertyOptional({ description: 'Дата истечения в ISO-формате' })
  @IsOptional()
  expiresAt?: Date;
}

