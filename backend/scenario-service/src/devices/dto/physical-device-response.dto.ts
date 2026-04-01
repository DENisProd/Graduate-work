import { ApiProperty } from '@nestjs/swagger';

export class PhysicalDeviceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @ApiProperty()
  deviceTypeId: number;

  @ApiProperty()
  houseId: string;

  @ApiProperty({ required: false, nullable: true })
  roomId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  deviceId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  firmwareVersion?: string | null;

  @ApiProperty({ required: false, nullable: true })
  ipAddress?: string | null;

  @ApiProperty({ required: false, nullable: true })
  macAddress?: string | null;

  @ApiProperty({ required: false, nullable: true })
  serialNumber?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PhysicalDeviceListResponseDto {
  @ApiProperty({ type: [PhysicalDeviceResponseDto] })
  items: PhysicalDeviceResponseDto[];

  @ApiProperty()
  total: number;
}
