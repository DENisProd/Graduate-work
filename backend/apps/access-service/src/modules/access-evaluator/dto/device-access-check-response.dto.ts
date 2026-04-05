import { ApiProperty } from '@nestjs/swagger';

/** Ответ проверки по функции устройства (`POST /api/v1/access-check`). */
export class DeviceAccessCheckResponseDto {
  @ApiProperty({ description: 'Доступ разрешён' })
  allow!: boolean;

  @ApiProperty({ description: 'Доступ запрещён' })
  deny!: boolean;
}
