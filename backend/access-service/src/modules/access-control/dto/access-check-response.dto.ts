import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class AccessRightDetailDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX }) rightId!: string;
  @ApiProperty({ enum: ['ALLOW', 'DENY', 'READ', 'WRITE'], example: 'ALLOW' }) type!: string;
  @ApiPropertyOptional({ format: 'uuid', example: UUID_EX }) deviceId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) deviceFunctionId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) houseRoomId?: string;
  @ApiProperty({ example: false }) isExpired!: boolean;
}

export class AccessCheckResponseDto {
  @ApiProperty({ example: true }) hasAccess!: boolean;
  @ApiPropertyOptional({ enum: ['ALLOW', 'DENY', 'READ', 'WRITE'], example: 'ALLOW' }) effectiveRightType?: string;
  @ApiProperty({ type: [AccessRightDetailDto] }) applicableRights!: AccessRightDetailDto[];
  @ApiProperty({ example: 'Доступ разрешён правом ALLOW' }) reason!: string;
}
