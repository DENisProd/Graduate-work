import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNotEmptyObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceStatus } from '../device-status.enum';

export class DeviceTranslationRequest {
  @ApiProperty({ example: 'Датчик' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Описание' })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class DeviceRequest {
  @ApiProperty({ example: 'SENSOR_01', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'ID категории устройства' })
  @IsNotEmpty()
  deviceCategoryId!: number;

  @ApiPropertyOptional({ enum: DeviceStatus, default: DeviceStatus.OFFLINE })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus = DeviceStatus.OFFLINE;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string | null;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firmwareVersion?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiPropertyOptional({ description: 'По умолчанию true (проверенная вручную запись)' })
  @IsOptional()
  @IsBoolean()
  isModerated?: boolean = true;

  @ApiProperty({
    description: 'Переводы name/description по коду локали (например en, ru). Значения — объекты с полями name и опционально description.',
    example: { en: { name: 'Sensor', description: 'Temperature' } },
  })
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => DeviceTranslationRequest)
  translations!: Record<string, DeviceTranslationRequest>;
}

