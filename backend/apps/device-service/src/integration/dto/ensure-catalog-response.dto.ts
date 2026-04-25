import { ApiProperty } from '@nestjs/swagger';

export class CatalogEnsureCreatedFlagsDto {
  @ApiProperty({ description: 'true, если категория была создана в этом вызове' })
  category!: boolean;

  @ApiProperty({ description: 'true, если устройство было создано в этом вызове' })
  device!: boolean;
}

export class EnsureCatalogResponseDto {
  @ApiProperty()
  deviceId!: number;

  @ApiProperty()
  deviceCategoryId!: number;

  @ApiProperty({ type: CatalogEnsureCreatedFlagsDto })
  created!: CatalogEnsureCreatedFlagsDto;
}
