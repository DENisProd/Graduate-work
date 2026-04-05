import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'ID субъекта (например externalUserId или memberId)' })
  actorId!: string;

  @ApiProperty({ description: 'Тип действия: ROLE_CREATED, MEMBER_ADDED, ACCESS_GRANTED, POLICY_CREATED и др.' })
  action!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  resourceId?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdAt!: string;
}
