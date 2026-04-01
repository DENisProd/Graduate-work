import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Внешний ID пользователя (userId из внешней системы)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  userId!: string;

  @ApiPropertyOptional({ description: 'URL аватара' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
