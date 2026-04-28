import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class RegisterResourceDto {
  @ApiProperty({ format: 'uuid', description: 'ID дома в access-service' })
  @IsUUID()
  houseId!: string;

  @ApiPropertyOptional({ description: 'externalId родительского ресурса (например, roomId из scenario-service)' })
  @IsOptional()
  @IsString()
  parentExternalId?: string;

  @ApiProperty({ description: 'Внешний ID ресурса (ID из вызывающего сервиса)' })
  @IsString()
  externalId!: string;

  @ApiProperty({ enum: ResourceType })
  @IsEnum(ResourceType)
  type!: ResourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Произвольные атрибуты (например, { "category": 12 })' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
