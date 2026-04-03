import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNotEmptyObject, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DeviceTypeTranslationRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class DeviceTypeRequest {
  @ApiProperty({ pattern: '^[A-Z][A-Z0-9_]*$', example: 'SENSOR' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  code!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiProperty({
    description: 'Переводы по коду локали',
    example: { en: { name: 'Sensor type' } },
  })
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => DeviceTypeTranslationRequest)
  translations!: Record<string, DeviceTypeTranslationRequest>;
}

