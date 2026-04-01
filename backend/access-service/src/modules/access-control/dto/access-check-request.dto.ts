import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class AccessCheckRequestDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX, description: 'ID проверяемого ресурса' })
  @IsNotEmpty({ message: 'ID ресурса обязателен' })
  @IsUUID()
  resourceId!: string;

  @ApiProperty({ format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', description: 'Внешний UUID пользователя' })
  @IsNotEmpty({ message: 'ID пользователя обязателен' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ example: 'read', description: 'Тип операции, например read или write' })
  @IsOptional()
  operationType?: string;
}
