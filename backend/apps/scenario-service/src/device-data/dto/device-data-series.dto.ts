import { ApiProperty } from '@nestjs/swagger';

export type DeviceDataSeriesRange = '1m' | '1h' | '6h' | '24h' | '7d';

export class DeviceDataSeriesPointDto {
  @ApiProperty({ description: 'Bucket timestamp (ISO)' })
  ts: string;

  @ApiProperty({ description: 'Aggregated numeric value (booleans are 0/1)' })
  value: number;
}

export class DeviceDataSeriesDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  capability: string;

  @ApiProperty({ required: false, nullable: true })
  attribute?: string | null;

  @ApiProperty({ required: false, nullable: true })
  unit?: string | null;

  @ApiProperty({ type: [DeviceDataSeriesPointDto] })
  points: DeviceDataSeriesPointDto[];
}

export class DeviceDataSeriesResponseDto {
  @ApiProperty({ description: 'Range window start (ISO)' })
  from: string;

  @ApiProperty({ description: 'Range window end (ISO)' })
  to: string;

  @ApiProperty({ type: [DeviceDataSeriesDto] })
  series: DeviceDataSeriesDto[];
}

