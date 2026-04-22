import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model, PipelineStage } from 'mongoose';
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

  private mapPlain(
    doc: Record<string, unknown> & { _id: Types.ObjectId },
  ): ZigbeeDeviceState {
    const { _id, ...rest } = doc;
    return {
      ...(rest as Omit<ZigbeeDeviceStateModel, never>),
      id: _id.toHexString(),
    };
  }

  /** Последнее состояние по каждому IEEE из списка (для начального снимка в Socket.IO). */
  async findLatestByDeviceIeeeAddrs(
    deviceIeeeAddrs: string[],
  ): Promise<Map<string, ZigbeeDeviceState>> {
    const unique = [...new Set(deviceIeeeAddrs)].filter((s) => s.length >= 3);
    const out = new Map<string, ZigbeeDeviceState>();
    if (unique.length === 0) return out;

    const pipeline: PipelineStage[] = [
      { $match: { deviceIeeeAddr: { $in: unique } } },
      { $sort: { timestamp: -1 as const } },
      {
        $group: {
          _id: '$deviceIeeeAddr',
          doc: { $first: '$$ROOT' },
        },
      },
    ];

    const rows = await this.model.aggregate(pipeline).exec();
    for (const row of rows as {
      _id: string;
      doc: Record<string, unknown> & { _id: Types.ObjectId };
    }[]) {
      if (typeof row._id === 'string') {
        out.set(row._id, this.mapPlain(row.doc));
      }
    }
    return out;
  }

  async deleteManyByIeeeAddr(ieeeAddr: string): Promise<number> {
    const result = await this.model.deleteMany({ deviceIeeeAddr: ieeeAddr }).exec();
    return result.deletedCount ?? 0;
  }

  async findMany(
    query: ListZigbeeStatesQuery,
  ): Promise<{ items: ZigbeeDeviceState[]; total: number }> {
    const filter: Record<string, unknown> = {
      deviceIeeeAddr: query.deviceIeeeAddr,
    };
    if (query.from ?? query.to) {
      filter.timestamp = {};
      if (query.from)
        (filter.timestamp as Record<string, Date>).$gte = query.from;
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
