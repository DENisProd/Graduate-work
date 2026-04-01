import { ApiProperty } from '@nestjs/swagger';

export class ScenarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @ApiProperty()
  houseId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ enum: ['OFFLINE', 'ONLINE', 'ERROR'] })
  status: 'OFFLINE' | 'ONLINE' | 'ERROR';

  @ApiProperty()
  creatorId: string;
}

export class ScenarioListResponseDto {
  @ApiProperty({ type: [ScenarioResponseDto] })
  items: ScenarioResponseDto[];

  @ApiProperty()
  total: number;
}
