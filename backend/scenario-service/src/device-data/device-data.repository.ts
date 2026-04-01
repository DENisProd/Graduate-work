import { Injectable } from '@nestjs/common';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { isValidObjectId, Types } from 'mongoose';
import type {
  CreateDeviceDataInput,
  ListDeviceDataQuery,
} from './schemas/device-data.schema';
import { skipTake } from '../common/schemas/pagination';

export const DEVICE_DATA_MODEL = 'DeviceData';

@Schema({ collection: 'DeviceData' })
export class DeviceDataModel {
  @Prop({ required: false, type: Types.ObjectId })
  deviceId?: Types.ObjectId;

  @Prop({ required: false, type: Number })
  deviceTypeId?: number;

  @Prop({ required: true })
  deviceFunction: string;

  @Prop({ required: true, enum: ['FLOAT', 'NUMBER', 'STRING', 'BOOLEAN'] })
  type: 'FLOAT' | 'NUMBER' | 'STRING' | 'BOOLEAN';

  @Prop({ type: String, default: null })
  unit?: string | null;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true, type: Object })
  data: Record<string, unknown>;
}

export type DeviceDataDocument = HydratedDocument<DeviceDataModel>;
export const DeviceDataSchema = SchemaFactory.createForClass(DeviceDataModel);

type DeviceDataDoc = DeviceDataModel & { _id: Types.ObjectId };
type DeviceData = DeviceDataModel & { id: string };

@Injectable()
export class DeviceDataRepository {
  constructor(
    @InjectModel(DEVICE_DATA_MODEL)
    private readonly model: Model<DeviceDataModel>,
  ) {}

  private map(doc: DeviceDataDocument): DeviceData {
    const { _id, ...rest } = doc.toObject<DeviceDataDoc>();
    return { ...rest, id: _id.toHexString() };
  }

  async create(input: CreateDeviceDataInput): Promise<DeviceData> {
    const doc = await this.model.create({ ...input });
    return this.map(doc);
  }

  async findById(id: string): Promise<DeviceData | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? this.map(doc) : null;
  }

  async findMany(
    params: ListDeviceDataQuery,
  ): Promise<{ items: DeviceData[]; total: number }> {
    const filter: Partial<
      Pick<DeviceDataModel, 'deviceTypeId' | 'deviceFunction' | 'type'>
    > & {
      timestamp?: { $gte?: Date; $lte?: Date };
      deviceId?: Types.ObjectId;
    } = {};
    if (params.deviceId && isValidObjectId(params.deviceId)) {
      filter.deviceId = new Types.ObjectId(params.deviceId);
    }
    if (params.deviceTypeId) filter.deviceTypeId = params.deviceTypeId;
    if (params.deviceFunction) filter.deviceFunction = params.deviceFunction;
    if (params.type) filter.type = params.type;
    if (params.from ?? params.to) {
      filter.timestamp = {};
      if (params.from) filter.timestamp.$gte = params.from;
      if (params.to) filter.timestamp.$lte = params.to;
    }

    const { skip, take } = skipTake({ page: params.page, limit: params.limit });
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(take)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items: items.map((item) => this.map(item)), total };
  }

  async delete(id: string): Promise<DeviceData> {
    if (!isValidObjectId(id)) {
      throw new Error('Invalid ObjectId');
    }
    const deleted = await this.model.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new Error('DeviceData not found');
    }
    return this.map(deleted);
  }
}
