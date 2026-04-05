import { ApiProperty } from '@nestjs/swagger';
import { AuditLogResponseDto } from './audit-log-response.dto';

/** Список записей аудита с общим количеством. */
export class AuditListResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto], description: 'Страница записей' })
  content!: AuditLogResponseDto[];

  @ApiProperty({ description: 'Всего записей по фильтру' })
  total!: number;
}
