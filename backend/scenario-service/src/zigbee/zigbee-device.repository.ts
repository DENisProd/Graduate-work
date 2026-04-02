import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { Types } from 'mongoose';
import type { UpsertZigbeeDeviceInput } from './schemas/zigbee.schemas';
import { skipTake } from '../common/schemas/pagination';
import type { ListZigbeeDevicesQuery } from './schemas/zigbee.schemas';
import {
  PHYSICAL_DEVICE_MODEL,
  type PhysicalDeviceDocument,
  PhysicalDeviceModel,
} from '../mongo/schemas/physical-device.mongo';

type PhysicalDeviceDoc = PhysicalDeviceModel & { _id: Types.ObjectId };
export type ZigbeeDevice = {
  id: string;
  physicalDeviceId: string;
  ieeeAddr: string;
  networkAddress?: number | null;
  type?: PhysicalDeviceModel['type'];
  manufacturerName?: string | null;
  modelId?: string | null;
  friendlyName?: string | null;
  lastSeen?: Date | null;
  definition?: Record<string, unknown> | null;
  capabilities?: string[];
};

@Injectable()
export class ZigbeeDeviceRepository {
  constructor(
    @InjectModel(PHYSICAL_DEVICE_MODEL)
    private readonly model: Model<PhysicalDeviceModel>,
  ) {}

  private map(doc: PhysicalDeviceDocument): ZigbeeDevice {
    const { _id, protocolAddress } = doc.toObject<PhysicalDeviceDoc>();
    if (!protocolAddress) {
      throw new Error('Invariant: zigbee info is missing');
    }
    return {
      id: _id.toHexString(),
      physicalDeviceId: _id.toHexString(),
      ieeeAddr: protocolAddress,
      networkAddress: doc.networkAddress ?? null,
      type: doc.type,
      manufacturerName: doc.manufacturerName ?? null,
      modelId: doc.model ?? null,
      friendlyName: doc.friendlyName ?? null,
      lastSeen: doc.lastSeen ?? null,
      definition: (doc.definition as Record<string, unknown> | null) ?? null,
      capabilities: doc.capabilities ?? [],
    };
  }

  async upsertByIeeeAddr(input: UpsertZigbeeDeviceInput): Promise<ZigbeeDevice> {
    const now = new Date();
    const updated = await this.model
      .findOneAndUpdate(
        { protocolAddress: input.ieeeAddr },
        {
          $set: {
            ...(input.friendlyName
              ? { name: input.friendlyName }
              : { name: input.ieeeAddr }),
            protocolAddress: input.ieeeAddr,
            ...('networkAddress' in input
              ? { networkAddress: input.networkAddress ?? null }
              : {}),
            ...('type' in input ? { type: input.type } : {}),
            ...('manufacturerName' in input
              ? { manufacturerName: input.manufacturerName ?? null }
              : {}),
            ...('modelId' in input ? { model: input.modelId ?? null } : {}),
            ...('friendlyName' in input
              ? { friendlyName: input.friendlyName ?? null }
              : {}),
            ...('lastSeen' in input ? { lastSeen: input.lastSeen ?? null } : {}),
            ...('definition' in input
              ? { definition: input.definition ?? null }
              : {}),
            ...(input.capabilities ? { capabilities: input.capabilities } : {}),
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { new: true, upsert: true },
      )
      .exec();

    return this.map(updated);
  }

  async findByIeeeAddr(ieeeAddr: string): Promise<ZigbeeDevice | null> {
    const doc = await this.model.findOne({ protocolAddress: ieeeAddr }).exec();
    return doc ? this.map(doc) : null;
  }

  async findMany(
    query: ListZigbeeDevicesQuery,
  ): Promise<{ items: ZigbeeDevice[]; total: number }> {
    const filter: Record<string, unknown> = { protocolAddress: { $ne: null } };
    if (query.type) filter.type = query.type;
    if (query.q) {
      filter.$or = [
        { protocolAddress: { $regex: query.q, $options: 'i' } },
        { friendlyName: { $regex: query.q, $options: 'i' } },
        { model: { $regex: query.q, $options: 'i' } },
        { manufacturerName: { $regex: query.q, $options: 'i' } },
      ];
    }

    const { skip, take } = skipTake({ page: query.page, limit: query.limit });
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(take)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { items: items.map((d) => this.map(d)), total };
  }
}

