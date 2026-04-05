import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ResourceType } from '@prisma/client';

export class CreateResourceDto {
  @ApiProperty({ enum: ResourceType, description: 'Тип ресурса (ROOM, DEVICE, DEVICE_FUNCTION, ...)' })
  @IsEnum(ResourceType)
  type!: ResourceType;

  @ApiProperty({ format: 'uuid', description: 'ID родительского ресурса' })
  @IsUUID()
  @IsNotEmpty()
  parentId!: string;

  @ApiProperty({
    required: false,
    description: 'Название ресурса (например, название комнаты)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    required: false,
    description: 'Внешний ID (например, ID устройства из внешней системы)',
  })
  @IsOptional()
  @IsString()
  externalId?: string;
}

