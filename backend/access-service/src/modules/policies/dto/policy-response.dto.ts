import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessRightType, PolicySubjectType } from '@prisma/client';

export class PolicyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  houseId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: AccessRightType })
  effect!: AccessRightType;

  @ApiProperty({ enum: PolicySubjectType })
  subjectType!: PolicySubjectType;

  @ApiPropertyOptional()
  subjectId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  resourceId?: string;

  @ApiPropertyOptional()
  condition?: Record<string, unknown>;

  @ApiProperty()
  priority!: number;

  @ApiProperty()
  createdAt!: string;
}

