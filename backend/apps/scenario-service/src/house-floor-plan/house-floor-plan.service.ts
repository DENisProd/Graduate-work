import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HouseFloorPlanRepository,
  type FloorPlanSnapshot,
} from './house-floor-plan.repository';

@Injectable()
export class HouseFloorPlanService {
  constructor(private readonly repo: HouseFloorPlanRepository) {}

  async getByHouseId(houseId: string) {
    const plan = await this.repo.findByHouseId(houseId);
    if (!plan) {
      throw new NotFoundException(`Floor plan for house ${houseId} not found`);
    }
    return plan;
  }

  async upsert(
    houseId: string,
    snapshot: FloorPlanSnapshot,
    expectedVersion?: number,
    updatedBy?: string,
  ) {
    const existing = await this.repo.findByHouseId(houseId);

    if (
      expectedVersion !== undefined &&
      existing &&
      existing.version !== expectedVersion
    ) {
      throw new ConflictException(
        'Floor plan was modified in another session. Reload and try again.',
      );
    }

    const version = existing ? existing.version + 1 : 1;
    return this.repo.upsert({
      houseId,
      version,
      snapshot,
      updatedBy,
    });
  }

  async delete(houseId: string) {
    const deleted = await this.repo.deleteByHouseId(houseId);
    if (!deleted) {
      throw new NotFoundException(`Floor plan for house ${houseId} not found`);
    }
    return { ok: true as const, houseId };
  }
}
