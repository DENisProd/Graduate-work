import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { PolicyResponseDto } from './dto/policy-response.dto';
import { UserId } from '../common/decorators/user-id.decorator';

const toResponse = (p: {
  id: string;
  houseId: string;
  name: string;
  effect: any;
  subjectType: any;
  subjectId: string | null;
  resourceId: string | null;
  condition: unknown | null;
  priority: number;
  createdAt: Date;
}): PolicyResponseDto => ({
  id: p.id,
  houseId: p.houseId,
  name: p.name,
  effect: p.effect,
  subjectType: p.subjectType,
  subjectId: p.subjectId ?? undefined,
  resourceId: p.resourceId ?? undefined,
  condition: (p.condition as Record<string, unknown> | null) ?? undefined,
  priority: p.priority,
  createdAt: p.createdAt.toISOString(),
});

@ApiTags('Policies')
@Controller()
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post('policies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать политику доступа (ABAC)' })
  async create(@Body() dto: CreatePolicyDto, @UserId() actorId: string): Promise<PolicyResponseDto> {
    const policy = await this.policiesService.create(dto, actorId);
    return toResponse(policy);
  }

  @Get('houses/:houseId/policies')
  @ApiOperation({ summary: 'Получить политики дома' })
  async findByHouseId(@Param('houseId') houseId: string): Promise<PolicyResponseDto[]> {
    const policies = await this.policiesService.findByHouseId(houseId);
    return policies.map(toResponse);
  }

  @Delete('policies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить политику' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.policiesService.delete(id);
  }
}


