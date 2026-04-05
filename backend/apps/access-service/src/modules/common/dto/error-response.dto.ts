import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldErrorDto {
  @ApiProperty()
  field!: string;

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional({ description: 'Отклонённое значение' })
  rejectedValue?: unknown;
}

/** Тело ошибки HTTP (глобальный фильтр исключений). */
export class ErrorResponse {
  @ApiProperty({ example: '2024-01-01T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 404 })
  status!: number;

  @ApiProperty({ example: 'Not Found' })
  error!: string;

  @ApiProperty({ description: 'Сообщение для клиента' })
  message!: string;

  @ApiProperty({ example: '/api/v1/houses/…' })
  path!: string;

  @ApiPropertyOptional({ type: [FieldErrorDto], description: 'Ошибки валидации полей' })
  fieldErrors?: FieldErrorDto[];
}
