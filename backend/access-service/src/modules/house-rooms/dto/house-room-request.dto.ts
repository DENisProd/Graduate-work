import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class HouseRoomRequestDto {
  @ApiProperty({ example: 'Гостиная' })
  @IsNotEmpty({ message: 'Название комнаты не может быть пустым' })
  @MaxLength(255, { message: 'Название комнаты не может быть длиннее 255 символов' })
  name!: string;

  @ApiProperty({ format: 'uuid', example: UUID_EX })
  @IsNotEmpty({ message: 'ID дома обязателен' })
  @IsUUID()
  houseId!: string;
}
