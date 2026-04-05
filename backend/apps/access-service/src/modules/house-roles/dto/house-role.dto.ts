import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateHouseRoleRequestDto {
  @ApiProperty({ example: 'Гость' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 10, description: 'Приоритет (меньше = выше в иерархии). Для кастомных ролей обычно > 3' })
  @IsInt()
  @Min(1)
  priority!: number;
}

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class HouseRoleResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EX }) houseId!: string;
  @ApiProperty() priority!: number;
  @ApiProperty() isSystem!: boolean;
  @ApiProperty({ type: [String], enum: ['INVITE_MEMBERS', 'EDIT_ROLES', 'MANAGE_DEVICES', 'MANAGE_AUTOMATIONS'] })
  permissions!: string[];
}
