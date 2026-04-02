import { ApiProperty } from '@nestjs/swagger';
import { DeviceDataType } from '../../common/schemas/enums';

export class DeviceDataResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  capability: string;

  @ApiProperty({ required: false, nullable: true })
  attribute?: string | null;

  @ApiProperty({ enum: DeviceDataType })
  type: DeviceDataType;

  @ApiProperty({ type: Object })
  value: unknown;

  @ApiProperty({ required: false, nullable: true })
  unit?: string | null;

  @ApiProperty({ required: false, nullable: true })
  quality?: number | null;

  @ApiProperty()
  timestamp: Date;

}

export class DeviceDataListResponseDto {
  @ApiProperty({ type: [DeviceDataResponseDto] })
  items: DeviceDataResponseDto[];

  @ApiProperty()
  total: number;
}
