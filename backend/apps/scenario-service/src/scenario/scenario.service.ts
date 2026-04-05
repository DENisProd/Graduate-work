import { Injectable, NotFoundException } from '@nestjs/common';
import { ScenarioRepository } from './scenario.repository';
import type {
  CreateScenarioInput,
  UpdateScenarioInput,
  ListScenariosQuery,
} from './schemas/scenario.schema';

@Injectable()
export class ScenarioService {
  constructor(private readonly repository: ScenarioRepository) {}

  async create(data: CreateScenarioInput) {
    return this.repository.create(data);
  }

  async findMany(query: ListScenariosQuery) {
    const { page, limit, houseId, status, creatorId } = query;
    return this.repository.findMany({
      page,
      limit,
      houseId,
      status,
      creatorId,
    });
  }

  async findById(id: string) {
    const scenario = await this.repository.findById(id);
    if (!scenario) throw new NotFoundException(`Scenario ${id} not found`);
    return scenario;
  }

  async update(id: string, data: UpdateScenarioInput) {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
