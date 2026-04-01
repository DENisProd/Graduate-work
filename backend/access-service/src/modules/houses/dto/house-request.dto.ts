import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class HouseRequestDto {
  @ApiProperty({ example: 'Загородный дом', description: 'Отображаемое название' })
  @IsNotEmpty({ message: 'Название дома не может быть пустым' })
  @MaxLength(255, { message: 'Название дома не может быть длиннее 255 символов' })
  name!: string;

  @ApiProperty({ format: 'uuid', example: UUID_EX, description: 'Внешний UUID владельца' })
  @IsNotEmpty({ message: 'ID владельца обязателен' })
  @IsUUID()
  ownerId!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example/avatars/house.png' })
  @IsOptional()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'г. Москва, ул. Примерная, 1' })
  @IsOptional()
  @MaxLength(500)
  address?: string;
}
