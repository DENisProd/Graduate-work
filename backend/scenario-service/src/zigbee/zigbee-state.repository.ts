import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { Types } from 'mongoose';
import type { CreateZigbeeStateInput } from './schemas/zigbee.schemas';
import { skipTake } from '../common/schemas/pagination';
import type { ListZigbeeStatesQuery } from './schemas/zigbee.schemas';
import {
  ZIGBEE_STATE_MODEL,
  type ZigbeeDeviceStateDocument,
  ZigbeeDeviceStateModel,
} from '../mongo/schemas/zigbee-state.mongo';

type ZigbeeStateDoc = ZigbeeDeviceStateModel & { _id: Types.ObjectId };
export type ZigbeeDeviceState = ZigbeeDeviceStateModel & { id: string };

@Injectable()
export class ZigbeeStateRepository {
  constructor(
    @InjectModel(ZIGBEE_STATE_MODEL)
    private readonly model: Model<ZigbeeDeviceStateModel>,
  ) {}

  private map(doc: ZigbeeDeviceStateDocument): ZigbeeDeviceState {
    const { _id, ...rest } = doc.toObject<ZigbeeStateDoc>();
    return { ...rest, id: _id.toHexString() };
  }

  async create(input: CreateZigbeeStateInput): Promise<ZigbeeDeviceState> {
    const timestamp = input.timestamp ?? new Date();
    const doc = await this.model.create({
      deviceIeeeAddr: input.deviceIeeeAddr,
      timestamp,
      payload: input.payload,
      state: input.state ?? null,
      brightness: input.brightness ?? null,
      linkquality: input.linkquality ?? null,
      colorMode: input.colorMode ?? null,
      occupancy: input.occupancy ?? null,
      temperature: input.temperature ?? null,
      humidity: input.humidity ?? null,
      battery: input.battery ?? null,
    });
    return this.map(doc);
  }

  async findMany(
    query: ListZigbeeStatesQuery,
  ): Promise<{ items: ZigbeeDeviceState[]; total: number }> {
    const filter: Record<string, unknown> = { deviceIeeeAddr: query.deviceIeeeAddr };
    if (query.from ?? query.to) {
      filter.timestamp = {};
      if (query.from) (filter.timestamp as Record<string, Date>).$gte = query.from;
      if (query.to) (filter.timestamp as Record<string, Date>).$lte = query.to;
    }

    const { skip, take } = skipTake({ page: query.page, limit: query.limit });
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(take)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { items: items.map((d) => this.map(d)), total };
  }
}

