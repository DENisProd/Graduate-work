import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { Types } from 'mongoose';
import { skipTake } from '../common/schemas/pagination';
import type { ListZigbeeDeviceLogsQuery } from './schemas/zigbee.schemas';
import {
  ZIGBEE_DEVICE_LOG_MODEL,
  type ZigbeeDeviceLogDocument,
  ZigbeeDeviceLogKind,
  ZigbeeDeviceLogModel,
  ZigbeeDeviceLogSource,
} from '../mongo/schemas/zigbee-device-log.mongo';
import type { ZigbeeDeviceState } from './zigbee-state.repository';

type ZigbeeDeviceLogDoc = ZigbeeDeviceLogModel & { _id: Types.ObjectId };

export type ZigbeeDeviceLogEntry = ZigbeeDeviceLogModel & { id: string };

export type CreateZigbeeDeviceLogInput = {
  deviceIeeeAddr: string;
  physicalDeviceId?: string | null;
  timestamp?: Date;
  source: ZigbeeDeviceLogSource;
  kind: ZigbeeDeviceLogKind;
  message?: string | null;
  metrics?: ZigbeeDeviceLogModel['metrics'];
  payloadKeys?: string[];
  stateDocumentId?: string | null;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class ZigbeeDeviceLogRepository {
  constructor(
    @InjectModel(ZIGBEE_DEVICE_LOG_MODEL)
    private readonly model: Model<ZigbeeDeviceLogModel>,
  ) {}

  private map(doc: ZigbeeDeviceLogDocument): ZigbeeDeviceLogEntry {
    const { _id, ...rest } = doc.toObject<ZigbeeDeviceLogDoc>();
    return { ...rest, id: _id.toHexString() };
  }

  async create(input: CreateZigbeeDeviceLogInput): Promise<ZigbeeDeviceLogEntry> {
    const doc = await this.model.create({
      deviceIeeeAddr: input.deviceIeeeAddr,
      physicalDeviceId: input.physicalDeviceId ?? null,
      timestamp: input.timestamp ?? new Date(),
      source: input.source,
      kind: input.kind,
      message: input.message ?? null,
      metrics: input.metrics ?? null,
      payloadKeys: input.payloadKeys ?? [],
      stateDocumentId: input.stateDocumentId ?? null,
      metadata: input.metadata ?? null,
    });
    return this.map(doc);
  }

  async appendFromState(params: {
    state: ZigbeeDeviceState;
    physicalDeviceId?: string | null;
    source: ZigbeeDeviceLogSource;
    payloadKeys: string[];
  }): Promise<void> {
    await this.create({
      deviceIeeeAddr: params.state.deviceIeeeAddr,
      physicalDeviceId: params.physicalDeviceId ?? null,
      timestamp: params.state.timestamp,
      source: params.source,
      kind: ZigbeeDeviceLogKind.StateIngest,
      metrics: {
        state: params.state.state ?? null,
        brightness: params.state.brightness ?? null,
        linkquality: params.state.linkquality ?? null,
        colorMode: params.state.colorMode ?? null,
        occupancy: params.state.occupancy ?? null,
        temperature: params.state.temperature ?? null,
        humidity: params.state.humidity ?? null,
        battery: params.state.battery ?? null,
      },
      payloadKeys: params.payloadKeys,
      stateDocumentId: params.state.id,
    });
  }

  async findMany(
    query: ListZigbeeDeviceLogsQuery,
  ): Promise<{ items: ZigbeeDeviceLogEntry[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (query.deviceIeeeAddr) filter.deviceIeeeAddr = query.deviceIeeeAddr;
    if (query.physicalDeviceId) filter.physicalDeviceId = query.physicalDeviceId;
    if (query.from ?? query.to) {
      filter.timestamp = {};
      if (query.from)
        (filter.timestamp as Record<string, Date>).$gte = query.from;
      if (query.to) (filter.timestamp as Record<string, Date>).$lte = query.to;
    }
    if (query.kind) filter.kind = query.kind;
    if (query.source) filter.source = query.source;

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
