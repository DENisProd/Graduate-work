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
import { ActionType } from '@prisma/client';

export class DeviceFunctionActionTranslationRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class DeviceFunctionActionRequest {
  @ApiProperty({ pattern: '^[a-z][a-z0-9_]*$', example: 'set_temperature' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/)
  code!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  deviceFunctionId!: number;

  @ApiProperty({ enum: ActionType })
  @IsNotEmpty()
  @IsEnum(ActionType)
  actionType!: ActionType;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  payloadTemplate?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiProperty({
    description: 'Переводы по коду локали',
    example: { en: { name: 'Set temperature' } },
  })
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => DeviceFunctionActionTranslationRequest)
  translations!: Record<string, DeviceFunctionActionTranslationRequest>;
}

