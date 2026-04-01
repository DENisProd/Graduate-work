import { Injectable } from '@nestjs/common';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { isValidObjectId, Types } from 'mongoose';
import type {
  CreatePhysicalDeviceInput,
  UpdatePhysicalDeviceInput,
} from './schemas/physical-device.schema';
import { skipTake } from '../common/schemas/pagination';

export const PHYSICAL_DEVICE_MODEL = 'PhysicalDevice';

@Schema({ collection: 'PhysicalDevice' })
export class PhysicalDeviceModel {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  description?: string | null;

  @Prop({ required: true, type: Number })
  deviceTypeId: number;

  @Prop({ required: true, type: String })
  houseId: string;

  @Prop({ type: String, default: null })
  deviceId?: string | null;

  @Prop({ type: String, default: null })
  roomId?: string | null;

  @Prop({ type: String, default: null })
  firmwareVersion?: string | null;

  @Prop({ type: String, default: null })
  ipAddress?: string | null;

  @Prop({ type: String, default: null })
  macAddress?: string | null;

  @Prop({ type: String, default: null })
  serialNumber?: string | null;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export type PhysicalDeviceDocument = HydratedDocument<PhysicalDeviceModel>;
export const PhysicalDeviceSchema =
  SchemaFactory.createForClass(PhysicalDeviceModel);

type PhysicalDeviceDoc = PhysicalDeviceModel & {
  _id: Types.ObjectId;
};
type PhysicalDevice = PhysicalDeviceModel & { id: string };

@Injectable()
export class PhysicalDeviceRepository {
  constructor(
    @InjectModel(PHYSICAL_DEVICE_MODEL)
    private readonly model: Model<PhysicalDeviceModel>,
  ) {}

  private map(doc: PhysicalDeviceDocument): PhysicalDevice {
    const { _id, ...rest } = doc.toObject<PhysicalDeviceDoc>();
    return { ...rest, id: _id.toHexString() };
  }

  async create(data: CreatePhysicalDeviceInput): Promise<PhysicalDevice> {
    const now = new Date();
    const doc = await this.model.create({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return this.map(doc);
  }

  async findById(id: string): Promise<PhysicalDevice | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? this.map(doc) : null;
  }

  async findMany(params: {
    houseId?: string;
    roomId?: string;
    page: number;
    limit: number;
  }): Promise<{ items: PhysicalDevice[]; total: number }> {
    const filter: Partial<Pick<PhysicalDeviceModel, 'houseId' | 'roomId'>> = {};
    if (params.houseId) filter.houseId = params.houseId;
    if (params.roomId) filter.roomId = params.roomId;
    const { skip, take } = skipTake({ page: params.page, limit: params.limit });

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { items: items.map((item) => this.map(item)), total };
  }

  async update(
    id: string,
    data: UpdatePhysicalDeviceInput,
  ): Promise<PhysicalDevice> {
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
      throw new Error('PhysicalDevice not found');
    }
    return this.map(updated);
  }

  async delete(id: string): Promise<PhysicalDevice> {
    if (!isValidObjectId(id)) {
      throw new Error('Invalid ObjectId');
    }
    const deleted = await this.model.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new Error('PhysicalDevice not found');
    }
    return this.map(deleted);
  }
}
