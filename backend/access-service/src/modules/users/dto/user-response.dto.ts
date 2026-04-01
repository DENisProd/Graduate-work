import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Внешний ID пользователя' })
  externalUserId!: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  createdAt!: string;
}
