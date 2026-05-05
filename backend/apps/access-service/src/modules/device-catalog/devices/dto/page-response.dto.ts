import { ApiProperty } from '@nestjs/swagger';

export class PageResponse<T> {
  @ApiProperty({ description: 'Элементы текущей страницы', type: 'array', items: { type: 'object' } })
  content!: T[];

  @ApiProperty({ example: 0 })
  page!: number;

  @ApiProperty({ example: 20 })
  size!: number;

  @ApiProperty({ description: 'Всего элементов по фильтру' })
  totalElements!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty()
  first!: boolean;

  @ApiProperty()
  last!: boolean;

  @ApiProperty()
  hasNext!: boolean;

  @ApiProperty()
  hasPrevious!: boolean;

  constructor(init?: Partial<PageResponse<T>>) {
    Object.assign(this, init);
  }
}
