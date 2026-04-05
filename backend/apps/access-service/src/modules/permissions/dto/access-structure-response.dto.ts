import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeviceFunctionNodeDto {
  @ApiProperty()
  id!: string;
  @ApiPropertyOptional()
  externalId?: string;
}

export class DeviceNodeDto {
  @ApiProperty()
  id!: string;
  @ApiPropertyOptional()
  externalId?: string;
  @ApiProperty({ type: [DeviceFunctionNodeDto] })
  functions!: DeviceFunctionNodeDto[];
}

export class RoomNodeDto {
  @ApiProperty()
  id!: string;
  @ApiPropertyOptional({ description: 'Название комнаты' })
  name?: string;
  @ApiPropertyOptional()
  externalId?: string;
  @ApiProperty({ type: [DeviceNodeDto] })
  devices!: DeviceNodeDto[];
}

export class HouseStructureDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty({ type: [RoomNodeDto] })
  rooms!: RoomNodeDto[];
}

export class AccessStructureResponseDto {
  @ApiProperty({ type: [HouseStructureDto] })
  houses!: HouseStructureDto[];
}
