import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { isValidObjectId, Types } from 'mongoose';
import { skipTake } from '../common/schemas/pagination';
import type { ListZigbeeLinksQuery } from './schemas/zigbee.schemas';
import {
  DEVICE_NETWORK_LINK_MODEL,
  type DeviceNetworkLinkDocument,
  DeviceNetworkLinkModel,
} from '../mongo/schemas/device-network-link.mongo';

type DeviceNetworkLinkDoc = DeviceNetworkLinkModel & { _id: Types.ObjectId };
export type DeviceNetworkLink = DeviceNetworkLinkModel & { id: string };

@Injectable()
export class ZigbeeLinkRepository {
  constructor(
    @InjectModel(DEVICE_NETWORK_LINK_MODEL)
    private readonly model: Model<DeviceNetworkLinkModel>,
  ) {}

  private map(doc: DeviceNetworkLinkDocument): DeviceNetworkLink {
    const { _id, ...rest } = doc.toObject<DeviceNetworkLinkDoc>();
    return { ...rest, id: _id.toHexString() };
  }

  async createMany(input: {
    collectedAt?: Date;
    links: Array<{
      sourceDeviceId: string;
      targetDeviceId: string;
      protocol: string;
      linkQuality?: number;
      rssi?: number;
      lqi?: number;
      metadata?: Record<string, unknown>;
    }>;
  }): Promise<{ items: DeviceNetworkLink[]; inserted: number }> {
    const collectedAt = input.collectedAt ?? new Date();
    const docs = await this.model.insertMany(
      input.links.map((l) => ({
        sourceDeviceId: new Types.ObjectId(l.sourceDeviceId),
        targetDeviceId: new Types.ObjectId(l.targetDeviceId),
        protocol: l.protocol,
        linkQuality: l.linkQuality ?? null,
        rssi: l.rssi ?? null,
        lqi: l.lqi ?? null,
        metadata: l.metadata ?? null,
        collectedAt,
      })),
      { ordered: false },
    );
    return { items: docs.map((d) => this.map(d)), inserted: docs.length };
  }

  async findMany(
    query: ListZigbeeLinksQuery,
  ): Promise<{ items: DeviceNetworkLink[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (query.sourceDeviceId && isValidObjectId(query.sourceDeviceId)) {
      filter.sourceDeviceId = new Types.ObjectId(query.sourceDeviceId);
    }
    if (query.protocol) filter.protocol = query.protocol;
    if (query.from ?? query.to) {
      filter.collectedAt = {};
      if (query.from) (filter.collectedAt as Record<string, Date>).$gte = query.from;
      if (query.to) (filter.collectedAt as Record<string, Date>).$lte = query.to;
    }

    const { skip, take } = skipTake({ page: query.page, limit: query.limit });
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ collectedAt: -1 })
        .skip(skip)
        .limit(take)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { items: items.map((d) => this.map(d)), total };
  }
}

