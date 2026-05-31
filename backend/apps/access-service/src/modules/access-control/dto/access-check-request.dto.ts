import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class AccessCheckRequestDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX, description: 'ID проверяемого ресурса' })
  @IsNotEmpty({ message: 'ID ресурса обязателен' })
  @IsUUID()
  resourceId!: string;

  @ApiPropertyOptional({ example: 'read', description: 'Тип операции, например read или write' })
  @IsOptional()
  operationType?: string;
}
