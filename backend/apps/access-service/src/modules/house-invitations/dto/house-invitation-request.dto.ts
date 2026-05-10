import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsUUID, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { HousePermission } from '@prisma/client';

const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';

export class HouseInvitationRequestDto {
  @ApiProperty({ format: 'uuid', example: UUID_EX })
  @IsNotEmpty({ message: 'ID дома обязателен' })
  @IsUUID()
  houseId!: string;

  @ApiPropertyOptional({
    example: 'Для мамы / временный доступ / тест',
    description: 'Пометка к приглашению (для UI). Не влияет на права.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Роль участника в этом доме после принятия приглашения. Не используйте вместе с permissions.',
    example: UUID_EX,
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({
    enum: HousePermission,
    isArray: true,
    description:
      'Явный набор доменных прав (INVITE_MEMBERS, EDIT_ROLES, …). После принятия будет создана одна кастомная роль. Не используйте вместе с roleId.',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(HousePermission, { each: true })
  permissions?: HousePermission[];

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Срок действия приглашения' })
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;
}
