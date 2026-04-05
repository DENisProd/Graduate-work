import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { isValidObjectId, Types } from 'mongoose';
import type {
  CreateDeviceDataInput,
  ListDeviceDataQuery,
} from './schemas/device-data.schema';
import { skipTake } from '../common/schemas/pagination';
import {
  DEVICE_DATA_MODEL,
  type DeviceDataDocument,
  DeviceDataModel,
} from '../mongo/schemas/device-data.mongo';

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
    const filter: Partial<Pick<DeviceDataModel, 'capability' | 'type'>> & {
      timestamp?: { $gte?: Date; $lte?: Date };
      deviceId?: Types.ObjectId;
      attribute?: string;
    } = {};
    if (params.deviceId && isValidObjectId(params.deviceId)) {
      filter.deviceId = new Types.ObjectId(params.deviceId);
    }
    if (params.capability) filter.capability = params.capability;
    if (params.attribute) filter.attribute = params.attribute;
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
