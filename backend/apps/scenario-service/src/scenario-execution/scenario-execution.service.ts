import { Injectable, NotFoundException } from '@nestjs/common';
import { ScenarioExecutionRepository } from './scenario-execution.repository';
import type {
  CreateScenarioExecutionInput,
  UpdateScenarioExecutionInput,
  ListScenarioExecutionsQuery,
} from './schemas/scenario-execution.schema';

@Injectable()
export class ScenarioExecutionService {
  constructor(private readonly repository: ScenarioExecutionRepository) {}

  async create(data: CreateScenarioExecutionInput) {
    return this.repository.create(data);
  }

  async findMany(query: ListScenarioExecutionsQuery) {
    const { page, limit, scenarioId, status, triggeredBy } = query;
    return this.repository.findMany({
      page,
      limit,
      scenarioId,
      status,
      triggeredBy,
    });
  }

  async findById(id: string) {
    const execution = await this.repository.findById(id);
    if (!execution)
      throw new NotFoundException(`ScenarioExecution ${id} not found`);
    return execution;
  }

  async update(id: string, data: UpdateScenarioExecutionInput) {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
