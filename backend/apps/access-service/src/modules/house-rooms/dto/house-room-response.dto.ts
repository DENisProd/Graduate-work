import { ApiProperty } from '@nestjs/swagger';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class HouseRoomResponseDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX }) id!: string;
  @ApiProperty({ example: 'Гостиная' }) name!: string;
  @ApiProperty({ format: 'uuid', example: UUID_EX }) houseId!: string;
  @ApiProperty({ example: 'Мой дом' }) houseName!: string;
  @ApiProperty({ example: '2024-01-01 12:00:00' }) createdAt!: string;
}
