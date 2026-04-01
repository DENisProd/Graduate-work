import { Injectable } from '@nestjs/common';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { isValidObjectId, Types } from 'mongoose';
import type {
  CreateScenarioInput,
  UpdateScenarioInput,
} from './schemas/scenario.schema';
import { skipTake } from '../common/schemas/pagination';

export const SCENARIO_MODEL = 'Scenario';

@Schema({ collection: 'Scenario' })
export class ScenarioModel {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  description?: string | null;

  @Prop({ required: true, type: String })
  houseId: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ required: true, enum: ['OFFLINE', 'ONLINE', 'ERROR'] })
  status: 'OFFLINE' | 'ONLINE' | 'ERROR';

  @Prop({ required: true })
  creatorId: string;
}

export type ScenarioDocument = HydratedDocument<ScenarioModel>;
export const ScenarioSchema = SchemaFactory.createForClass(ScenarioModel);

type ScenarioDoc = ScenarioModel & { _id: Types.ObjectId };
type Scenario = ScenarioModel & { id: string };

@Injectable()
export class ScenarioRepository {
  constructor(
    @InjectModel(SCENARIO_MODEL)
    private readonly model: Model<ScenarioModel>,
  ) {}

  private map(doc: ScenarioDocument): Scenario {
    const { _id, ...rest } = doc.toObject<ScenarioDoc>();
    return { ...rest, id: _id.toHexString() };
  }

  async create(data: CreateScenarioInput): Promise<Scenario> {
    const now = new Date();
    const doc = await this.model.create({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return this.map(doc);
  }

  async findById(id: string): Promise<Scenario | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? this.map(doc) : null;
  }

  async findMany(params: {
    houseId?: string;
    status?: ScenarioModel['status'];
    creatorId?: string;
    page: number;
    limit: number;
  }): Promise<{ items: Scenario[]; total: number }> {
    const filter: Partial<
      Pick<ScenarioModel, 'houseId' | 'creatorId' | 'status'>
    > = {};
    if (params.houseId) filter.houseId = params.houseId;
    if (params.creatorId) filter.creatorId = params.creatorId;
    if (params.status) filter.status = params.status;

    const { skip, take } = skipTake({ page: params.page, limit: params.limit });
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(take)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items: items.map((item) => this.map(item)), total };
  }

  async update(id: string, data: UpdateScenarioInput): Promise<Scenario> {
    if (!isValidObjectId(id)) {
      throw new Error('Invalid ObjectId');
    }
    const updated = await this.model
      .findByIdAndUpdate(
        id,
        { $set: { ...data, updatedAt: new Date() } },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new Error('Scenario not found');
    }
    return this.map(updated);
  }

  async delete(id: string): Promise<Scenario> {
    if (!isValidObjectId(id)) {
      throw new Error('Invalid ObjectId');
    }
    const deleted = await this.model.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new Error('Scenario not found');
    }
    return this.map(deleted);
  }
}
