import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class HouseResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX }) id!: string;
  @ApiProperty({ example: 'Загородный дом' }) name!: string;
  @ApiProperty({ format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }) ownerId!: string;
  @ApiPropertyOptional() ownerAvatarUrl?: string;
  @ApiPropertyOptional() avatarUrl?: string;
  @ApiPropertyOptional() address?: string;
  @ApiProperty({ example: '2024-01-01 12:00:00' }) createdAt!: string;
  @ApiProperty({ example: '2024-01-01 12:00:00' }) updatedAt!: string;
}
