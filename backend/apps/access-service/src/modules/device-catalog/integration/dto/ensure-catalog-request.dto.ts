import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, Matches, ValidateNested } from 'class-validator';

export class CatalogTranslationItemDto {
  @ApiProperty({ example: 'Temperature sensor' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Measures ambient temperature' })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class EnsureCatalogTranslationsDto {
  @ApiPropertyOptional({
    description: 'Переводы для типа (локаль -> name). Если нет — имя строится из `deviceTypeCode`.',
  })
  @IsOptional()
  @IsObject()
  deviceType?: Record<string, CatalogTranslationItemDto>;

  @ApiPropertyOptional({ description: 'Переводы для категории.' })
  @IsOptional()
  @IsObject()
  deviceCategory?: Record<string, CatalogTranslationItemDto>;

  @ApiPropertyOptional({ description: 'Переводы для устройства.' })
  @IsOptional()
  @IsObject()
  device?: Record<string, CatalogTranslationItemDto>;
}

export class EnsureCatalogRequestDto {
  @ApiProperty({ description: 'Код типа в UPPER_SNAKE_CASE', example: 'ZIGBEE' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  deviceTypeCode!: string;

  @ApiProperty({ description: 'Код категории в UPPER_SNAKE_CASE', example: 'TEMP_SENSOR' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  deviceCategoryCode!: string;

  @ApiProperty({ description: 'Стабильный ключ устройства (unique в каталоге), max 100', example: '0x1234567890abcdef' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  deviceCode!: string;

  @ApiPropertyOptional({ type: EnsureCatalogTranslationsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EnsureCatalogTranslationsDto)
  translations?: EnsureCatalogTranslationsDto;
}
