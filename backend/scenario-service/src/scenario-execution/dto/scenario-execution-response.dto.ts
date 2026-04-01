import { ApiProperty } from '@nestjs/swagger';

export class ScenarioExecutionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  scenarioId: string;

  @ApiProperty({ enum: ['RUNNING', 'SUCCESS', 'FAILURE'] })
  status: 'RUNNING' | 'SUCCESS' | 'FAILURE';

  @ApiProperty({ enum: ['SCHEDULE', 'MANUAL', 'AUTOMATIC', 'SYSTEM', 'API'] })
  triggeredBy: 'SCHEDULE' | 'MANUAL' | 'AUTOMATIC' | 'SYSTEM' | 'API';

  @ApiProperty({ type: Object })
  triggerData: Record<string, unknown>;

  @ApiProperty({ required: false, nullable: true })
  errorMessage?: string | null;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  endedAt?: Date | null;
}

export class ScenarioExecutionListResponseDto {
  @ApiProperty({ type: [ScenarioExecutionResponseDto] })
  items: ScenarioExecutionResponseDto[];

  @ApiProperty()
  total: number;
}
