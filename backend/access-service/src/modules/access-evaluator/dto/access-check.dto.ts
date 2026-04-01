import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';

export class AccessCheckDto {
  @ApiProperty({ description: 'Внешний ID пользователя (externalUserId)' })
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ format: 'uuid', description: 'ID ресурса' })
  @IsUUID()
  resourceId!: string;

  @ApiProperty({ enum: ['READ', 'WRITE'], description: 'Операция' })
  @IsIn(['READ', 'WRITE'])
  action!: 'READ' | 'WRITE';
}

