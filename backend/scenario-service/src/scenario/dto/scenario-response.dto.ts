import { ApiProperty } from '@nestjs/swagger';
import { ScenarioStatus } from '../../common/schemas/enums';
import type { ScenarioDefinition } from '../schemas/scenario-definition.schema';
import { scenarioDefinitionExampleHome } from '../schemas/scenario-definition.schema';

export class ScenarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @ApiProperty()
  houseId: string;

  @ApiProperty({
    type: Object,
    description:
      'Универсальное определение сценария (scope/triggers/conditions/actions/options)',
    example: scenarioDefinitionExampleHome,
  })
  definition: ScenarioDefinition;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ enum: ScenarioStatus })
  status: ScenarioStatus;

  @ApiProperty()
  creatorId: string;
}

export class ScenarioListResponseDto {
  @ApiProperty({ type: [ScenarioResponseDto] })
  items: ScenarioResponseDto[];

  @ApiProperty()
  total: number;
}
