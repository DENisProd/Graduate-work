import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class AccessCheckByDeviceDto {
  @ApiProperty({ description: 'ID или externalId функции устройства (deviceFunctionId)' })
  @IsNotEmpty()
  @IsString()
  deviceFunctionId!: string;

  @ApiProperty({ enum: ['READ', 'WRITE'], description: 'Операция' })
  @IsIn(['READ', 'WRITE'])
  action!: 'READ' | 'WRITE';
}
