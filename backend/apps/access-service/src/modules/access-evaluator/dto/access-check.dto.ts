import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

export class AccessCheckDto {
  @ApiProperty({ format: 'uuid', description: 'ID ресурса' })
  @IsUUID()
  resourceId!: string;

  @ApiProperty({ enum: ['READ', 'WRITE'], description: 'Операция' })
  @IsIn(['READ', 'WRITE'])
  action!: 'READ' | 'WRITE';
}

