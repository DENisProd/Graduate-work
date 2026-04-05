import { ApiProperty } from '@nestjs/swagger';
import {
  ScenarioExecutionStatus,
  TriggerSourceType,
} from '../../common/schemas/enums';

export class ScenarioExecutionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  scenarioId: string;

  @ApiProperty({ enum: ScenarioExecutionStatus })
  status: ScenarioExecutionStatus;

  @ApiProperty({ enum: TriggerSourceType })
  triggeredBy: TriggerSourceType;

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
