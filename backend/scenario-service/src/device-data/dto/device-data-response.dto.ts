import { ApiProperty } from '@nestjs/swagger';

export class DeviceDataResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false, nullable: true })
  deviceId?: string | null;

  @ApiProperty()
  deviceTypeId: number;

  @ApiProperty()
  deviceFunction: string;

  @ApiProperty({ enum: ['FLOAT', 'NUMBER', 'STRING', 'BOOLEAN'] })
  type: 'FLOAT' | 'NUMBER' | 'STRING' | 'BOOLEAN';

  @ApiProperty({ required: false, nullable: true })
  unit?: string | null;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty({ type: Object })
  data: Record<string, unknown>;
}

export class DeviceDataListResponseDto {
  @ApiProperty({ type: [DeviceDataResponseDto] })
  items: DeviceDataResponseDto[];

  @ApiProperty()
  total: number;
}
