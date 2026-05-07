import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { isValidObjectId, Types } from 'mongoose';
import type { UpsertZigbeeDeviceInput } from './schemas/zigbee.schemas';
import { skipTake } from '../common/schemas/pagination';
import type { ListZigbeeDevicesQuery } from './schemas/zigbee.schemas';
import {
  PHYSICAL_DEVICE_MODEL,
  type PhysicalDeviceDocument,
  PhysicalDeviceModel,
} from '../mongo/schemas/physical-device.mongo';

type PhysicalDeviceDoc = PhysicalDeviceModel & { _id: Types.ObjectId };
/** EUI-64 zigbee2mqtt (`0x` + 16 hex) — канонический вид для БД и топиков. */
export function canonicalZigbeeIeeeAddr(ieee: string): string {
  const t = ieee.trim();
  const m = /^0x([0-9a-fA-F]{16})$/i.exec(t);
  if (m) return `0x${m[1].toLowerCase()}`;
  return t;
}

export type ZigbeeDevice = {
  id: string;
  physicalDeviceId: string;
  houseId?: string | null;
  deviceId?: number | null;
  deviceCategoryId?: number | null;
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
      houseId: doc.houseId ?? null,
      deviceId: doc.deviceId ?? null,
      deviceCategoryId: doc.deviceCategoryId ?? null,
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

  async upsertByIeeeAddr(
    input: UpsertZigbeeDeviceInput,
  ): Promise<ZigbeeDevice> {
    const ieeeAddr = canonicalZigbeeIeeeAddr(input.ieeeAddr);
    const now = new Date();
    const existing = await this.findByIeeeAddr(ieeeAddr);
    const filter = existing
      ? { _id: new Types.ObjectId(existing.id) }
      : { protocolAddress: ieeeAddr };

    const updated = await this.model
      .findOneAndUpdate(
        filter,
        {
          $set: {
            ...(input.friendlyName
              ? { name: input.friendlyName }
              : { name: ieeeAddr }),
            protocolAddress: ieeeAddr,
            ...('networkAddress' in input
              ? { networkAddress: input.networkAddress ?? null }
              : {}),
            ...('type' in input ? { type: input.type } : {}),
            ...('manufacturerName' in input
              ? { manufacturerName: input.manufacturerName ?? null }
              : {}),
            ...('modelId' in input ? { model: input.modelId ?? null } : {}),
            ...('deviceId' in input
              ? { deviceId: input.deviceId ?? null }
              : {}),
            ...('deviceCategoryId' in input
              ? { deviceCategoryId: input.deviceCategoryId ?? null }
              : {}),
            ...('friendlyName' in input
              ? { friendlyName: input.friendlyName ?? null }
              : {}),
            ...('lastSeen' in input
              ? { lastSeen: input.lastSeen ?? null }
              : {}),
            ...('definition' in input
              ? { definition: input.definition ?? null }
              : {}),
            ...(input.capabilities ? { capabilities: input.capabilities } : {}),
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { returnDocument: 'after', upsert: !existing },
      )
      .exec();

    if (!updated) {
      throw new Error('findOneAndUpdate returned no document');
    }
    return this.map(updated);
  }

  async touchLastSeen(ieeeAddr: string, at: Date = new Date()): Promise<void> {
    const dev = await this.findByIeeeAddr(ieeeAddr);
    if (!dev) return;
    await this.model
      .updateOne(
        { _id: new Types.ObjectId(dev.id) },
        { $set: { lastSeen: at, updatedAt: at } },
      )
      .exec();
  }

  async findByIeeeAddr(ieeeAddr: string): Promise<ZigbeeDevice | null> {
    const t = ieeeAddr.trim();
    const m = /^0x([0-9a-fA-F]{16})$/i.exec(t);
    if (m) {
      const canonical = `0x${m[1].toLowerCase()}`;
      const doc = await this.model
        .findOne({
          protocolAddress: { $ne: null },
          $expr: {
            $eq: [{ $toLower: '$protocolAddress' }, canonical],
          },
        })
        .exec();
      return doc ? this.map(doc) : null;
    }
    const doc = await this.model.findOne({ protocolAddress: t }).exec();
    return doc ? this.map(doc) : null;
  }

  async findByFriendlyName(friendlyName: string): Promise<ZigbeeDevice | null> {
    const doc = await this.model
      .findOne({
        friendlyName,
        protocolAddress: { $ne: null },
      })
      .exec();
    return doc ? this.map(doc) : null;
  }

  /** Разрешение Mongo ObjectId физического устройства → IEEE (protocolAddress). */
  async findIeeeAddrsByPhysicalIds(
    ids: string[],
  ): Promise<Map<string, string>> {
    const valid = ids.filter((id) => isValidObjectId(id));
    const out = new Map<string, string>();
    if (valid.length === 0) return out;
    const oid = valid.map((id) => new Types.ObjectId(id));
    const docs = await this.model
      .find({
        _id: { $in: oid },
        protocolAddress: { $ne: null, $exists: true },
      })
      .select({ _id: 1, protocolAddress: 1 })
      .exec();
    for (const d of docs) {
      const pa = d.protocolAddress;
      if (typeof pa === 'string' && pa.length >= 3) {
        out.set(d._id.toHexString(), pa);
      }
    }
    return out;
  }

  async deleteByIeeeAddr(ieeeAddr: string): Promise<ZigbeeDevice | null> {
    const canonical = canonicalZigbeeIeeeAddr(ieeeAddr);
    const dev = await this.findByIeeeAddr(canonical);
    if (!dev) return null;
    await this.model.findByIdAndDelete(new Types.ObjectId(dev.id)).exec();
    return dev;
  }

  async findMany(
    query: ListZigbeeDevicesQuery,
  ): Promise<{ items: ZigbeeDevice[]; total: number }> {
    const and: Record<string, unknown>[] = [{ protocolAddress: { $ne: null } }];
    if (query.type) and.push({ type: query.type });
    if (query.q) {
      and.push({
        $or: [
          { protocolAddress: { $regex: query.q, $options: 'i' } },
          { friendlyName: { $regex: query.q, $options: 'i' } },
          { model: { $regex: query.q, $options: 'i' } },
          { manufacturerName: { $regex: query.q, $options: 'i' } },
        ],
      });
    }
    if (query.houseId) {
      // Show the Coordinator in house view even if it isn't assigned to a house yet.
      // (Coordinator is a shared infrastructure device but users expect to see it in the list.)
      and.push({ $or: [{ houseId: query.houseId }, { type: 'Coordinator' }] });
    }
    const filter = { $and: and };

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
