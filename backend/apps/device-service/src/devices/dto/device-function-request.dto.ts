import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
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
import { DeviceFunctionType } from '@prisma/client';

export class DeviceFunctionTranslationRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class DeviceFunctionRequest {
  @ApiProperty({ pattern: '^[a-z][a-z0-9_]*$', example: 'temperature' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/)
  code!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  deviceId!: number;

  @ApiProperty({ enum: DeviceFunctionType })
  @IsNotEmpty()
  @IsEnum(DeviceFunctionType)
  functionType!: DeviceFunctionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentValue?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minValue?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxValue?: number | null;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiProperty({
    description: 'Переводы по коду локали',
    example: { en: { name: 'Temperature' } },
  })
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => DeviceFunctionTranslationRequest)
  translations!: Record<string, DeviceFunctionTranslationRequest>;
}

