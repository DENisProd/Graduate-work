import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class HouseUpdateRequestDto {
  @ApiPropertyOptional({ example: 'Загородный дом', description: 'Отображаемое название' })
  @IsOptional()
  @IsNotEmpty({ message: 'Название дома не может быть пустым' })
  @MaxLength(255, { message: 'Название дома не может быть длиннее 255 символов' })
  name?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example/avatars/house.png' })
  @IsOptional()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'г. Москва, ул. Примерная, 1' })
  @IsOptional()
  @MaxLength(500)
  address?: string;
}

