import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType } from '@prisma/client';

export class ResourceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  houseId!: string;

  @ApiProperty({ enum: ResourceType })
  type!: ResourceType;

  @ApiPropertyOptional()
  externalId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  parentId?: string;

  @ApiProperty()
  path!: string;

  @ApiProperty()
  depth!: number;

  @ApiProperty()
  createdAt!: string;
}

