import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({ description: 'URL аватара' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
