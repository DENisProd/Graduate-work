import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DeviceCategoryTranslationRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class DeviceCategoryRequest {
  @ApiProperty({ pattern: '^[A-Z][A-Z0-9_]*$', example: 'TEMP_SENSOR' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  code!: string;

  @ApiProperty({ description: 'ID типа устройства' })
  @IsNotEmpty()
  @IsNumber()
  deviceTypeId!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiPropertyOptional({ description: 'По умолчанию true (проверенная вручную запись)' })
  @IsOptional()
  @IsBoolean()
  isModerated?: boolean = true;

  @ApiProperty({
    description: 'Переводы по коду локали',
    example: { en: { name: 'Temperature sensor' } },
  })
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => DeviceCategoryTranslationRequest)
  translations!: Record<string, DeviceCategoryTranslationRequest>;
}
