import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { isValidObjectId, Types } from 'mongoose';
import type {
  CreateScenarioExecutionInput,
  UpdateScenarioExecutionInput,
} from './schemas/scenario-execution.schema';
import { skipTake } from '../common/schemas/pagination';
import {
  SCENARIO_EXECUTION_MODEL,
  type ScenarioExecutionDocument,
  ScenarioExecutionModel,
} from '../mongo/schemas/scenario-execution.mongo';

type ScenarioExecutionDoc = ScenarioExecutionModel & {
  _id: Types.ObjectId;
};
type ScenarioExecution = ScenarioExecutionModel & { id: string };

@Injectable()
export class ScenarioExecutionRepository {
  constructor(
    @InjectModel(SCENARIO_EXECUTION_MODEL)
    private readonly model: Model<ScenarioExecutionModel>,
  ) {}

  private map(doc: ScenarioExecutionDocument): ScenarioExecution {
    const { _id, ...rest } = doc.toObject<ScenarioExecutionDoc>();
    return { ...rest, id: _id.toHexString() };
  }

  async create(
    input: CreateScenarioExecutionInput,
  ): Promise<ScenarioExecution> {
    const doc = await this.model.create({
      ...input,
      startedAt: new Date(),
      endedAt: null,
      errorMessage: input.errorMessage ?? null,
    });
    return this.map(doc);
  }

  async findById(id: string): Promise<ScenarioExecution | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? this.map(doc) : null;
  }

  async findMany(params: {
    scenarioId?: string;
    status?: ScenarioExecutionModel['status'];
    triggeredBy?: ScenarioExecutionModel['triggeredBy'];
    page: number;
    limit: number;
  }): Promise<{ items: ScenarioExecution[]; total: number }> {
    const filter: Partial<
      Pick<ScenarioExecutionModel, 'scenarioId' | 'status' | 'triggeredBy'>
    > = {};
    if (params.scenarioId) filter.scenarioId = params.scenarioId;
    if (params.status) filter.status = params.status;
    if (params.triggeredBy) filter.triggeredBy = params.triggeredBy;
    const { skip, take } = skipTake({ page: params.page, limit: params.limit });

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(take)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items: items.map((item) => this.map(item)), total };
  }

  async update(
    id: string,
    data: UpdateScenarioExecutionInput,
  ): Promise<ScenarioExecution> {
    if (!isValidObjectId(id)) {
      throw new Error('Invalid ObjectId');
    }
    const updateData: Partial<ScenarioExecutionModel> = {
      ...data,
      endedAt: data.endedAt ?? null,
      errorMessage: data.errorMessage ?? null,
    };
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
    if (!updated) {
      throw new Error('ScenarioExecution not found');
    }
    return this.map(updated);
  }

  async delete(id: string): Promise<ScenarioExecution> {
    if (!isValidObjectId(id)) {
      throw new Error('Invalid ObjectId');
    }
    const deleted = await this.model.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new Error('ScenarioExecution not found');
    }
    return this.map(deleted);
  }
}
