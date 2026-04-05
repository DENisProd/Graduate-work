import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Результат проверки доступа к ресурсу (`POST /api/v1/access/check`). */
export class AccessDecisionResponseDto {
  @ApiProperty({ description: 'Разрешено ли действие' })
  allowed!: boolean;

  @ApiProperty({
    enum: ['EFFECTIVE', 'ACCESS_RIGHT', 'POLICY', 'NONE'],
    description: 'Источник решения: эффективные права, явное право, политика ABAC или отказ',
  })
  source!: 'EFFECTIVE' | 'ACCESS_RIGHT' | 'POLICY' | 'NONE';

  @ApiPropertyOptional({
    description: 'Тип права/эффекта, на основании которого принято решение (если применимо)',
  })
  rightType?: string;
}
