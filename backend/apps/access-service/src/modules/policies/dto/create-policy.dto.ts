import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessRightType, PolicySubjectType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePolicyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: AccessRightType })
  @IsEnum(AccessRightType)
  effect!: AccessRightType;

  @ApiProperty({ enum: PolicySubjectType })
  @IsEnum(PolicySubjectType)
  subjectType!: PolicySubjectType;

  @ApiPropertyOptional({ description: 'ID субъекта (user/role/member) в зависимости от subjectType' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ format: 'uuid', description: 'Ресурс, к которому применяется политика' })
  @IsUUID()
  resourceId!: string;

  @ApiPropertyOptional({ description: 'Произвольные условия в виде JSON' })
  @IsOptional()
  condition?: Record<string, unknown>;

  @ApiProperty({ description: 'Чем меньше число, тем выше приоритет', default: 100 })
  @IsInt()
  @Min(0)
  priority!: number;
}

