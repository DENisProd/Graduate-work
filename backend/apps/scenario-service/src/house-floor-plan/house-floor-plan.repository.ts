import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import {
  HOUSE_FLOOR_PLAN_MODEL,
  type HouseFloorPlanDocument,
  type HouseFloorPlanModel,
} from '../mongo/schemas/house-floor-plan.mongo';

export interface FloorPlanSnapshot {
  room: Record<string, unknown>;
  timestamp: number;
  roomRegions?: unknown[];
}

export interface HouseFloorPlanRecord {
  id: string;
  houseId: string;
  version: number;
  snapshot: FloorPlanSnapshot;
  updatedAt: string;
  updatedBy?: string;
}

type Doc = HouseFloorPlanModel & { _id: Types.ObjectId; updatedAt?: Date };

@Injectable()
export class HouseFloorPlanRepository {
  constructor(
    @InjectModel(HOUSE_FLOOR_PLAN_MODEL)
    private readonly model: Model<HouseFloorPlanModel>,
  ) {}

  private map(doc: HouseFloorPlanDocument): HouseFloorPlanRecord {
    const { _id, updatedAt, ...rest } = doc.toObject<Doc>();
    return {
      ...rest,
      id: _id.toHexString(),
      snapshot: rest.snapshot as unknown as FloorPlanSnapshot,
      updatedAt: (updatedAt ?? new Date()).toISOString(),
    };
  }

  async findByHouseId(houseId: string): Promise<HouseFloorPlanRecord | null> {
    const doc = await this.model.findOne({ houseId }).exec();
    return doc ? this.map(doc) : null;
  }

  async upsert(data: {
    houseId: string;
    version: number;
    snapshot: FloorPlanSnapshot;
    updatedBy?: string;
  }): Promise<HouseFloorPlanRecord> {
    const doc = await this.model
      .findOneAndUpdate(
        { houseId: data.houseId },
        {
          $set: {
            version: data.version,
            snapshot: data.snapshot,
            updatedBy: data.updatedBy,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
    return this.map(doc!);
  }

  async deleteByHouseId(houseId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ houseId }).exec();
    return result.deletedCount > 0;
  }
}
