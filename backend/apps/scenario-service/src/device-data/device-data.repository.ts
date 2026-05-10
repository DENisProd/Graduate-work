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
import { DeviceDataType } from '../common/schemas/enums';
import type { DeviceDataSeriesRange } from './schemas/device-data.schema';

type DeviceDataDoc = DeviceDataModel & { _id: Types.ObjectId };
type DeviceData = DeviceDataModel & { id: string };

export type DeviceDataSeriesPoint = { ts: Date; value: number };
export type DeviceDataSeries = {
  key: string;
  capability: string;
  attribute: string | null;
  unit: string | null;
  points: DeviceDataSeriesPoint[];
};

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
      deviceId?: string;
      attribute?: string;
    } = {};
    if (params.deviceId) filter.deviceId = params.deviceId;
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

  private bucketForRange(range: DeviceDataSeriesRange): { unit: 'minute' | 'hour'; binSize: number } {
    switch (range) {
      case '1m':
        return { unit: 'minute', binSize: 1 };
      case '1h':
        return { unit: 'minute', binSize: 1 };
      case '6h':
        return { unit: 'minute', binSize: 5 };
      case '24h':
        return { unit: 'minute', binSize: 15 };
      case '7d':
      default:
        return { unit: 'hour', binSize: 1 };
    }
  }

  /**
   * Boolean timelines need finer buckets than numeric series — otherwise `$last`
   * in a 15‑minute bucket hides short ON bursts (looks like flat 0).
   */
  private booleanBucketForRange(range: DeviceDataSeriesRange): {
    unit: 'minute' | 'hour';
    binSize: number;
  } {
    switch (range) {
      case '1m':
      case '1h':
      case '6h':
      case '24h':
        return { unit: 'minute', binSize: 1 };
      case '7d':
      default:
        return { unit: 'minute', binSize: 15 };
    }
  }

  private msForRange(range: DeviceDataSeriesRange): number {
    switch (range) {
      case '1m':
        return 60_000;
      case '1h':
        return 3_600_000;
      case '6h':
        return 21_600_000;
      case '24h':
        return 86_400_000;
      case '7d':
      default:
        return 604_800_000;
    }
  }

  async series(params: {
    deviceId: string;
    range: DeviceDataSeriesRange;
    capabilities?: string[];
    to?: Date;
  }): Promise<{ from: Date; to: Date; series: DeviceDataSeries[] }> {
    const to = params.to ?? new Date();
    const from = new Date(to.getTime() - this.msForRange(params.range));
    const numericBucket = this.bucketForRange(params.range);
    const boolBucket = this.booleanBucketForRange(params.range);

    const match: Record<string, unknown> = {
      deviceId: params.deviceId,
      timestamp: { $gte: from, $lte: to },
    };
    if (params.capabilities && params.capabilities.length > 0) {
      match.capability = { $in: params.capabilities };
    }

    // Convert value to numeric for charting.
    // Supports:
    // - BOOLEAN -> 0/1
    // - NUMBER/FLOAT -> number OR { value: number|string } OR string
    // - STRING -> ON/OFF/true/false to 1/0 else null
    const numericValue = {
      $switch: {
        branches: [
          {
            case: { $eq: ['$type', DeviceDataType.BOOLEAN] },
            then: { $cond: [{ $eq: ['$valueRaw', true] }, 1, 0] },
          },
          {
            case: { $in: ['$type', [DeviceDataType.NUMBER, DeviceDataType.FLOAT]] },
            then: {
              $let: {
                vars: {
                  v: '$valueRaw',
                  v2: '$valueRaw.value',
                },
                in: {
                  $cond: [
                    { $in: [{ $type: '$$v' }, ['int', 'long', 'double', 'decimal']] },
                    '$$v',
                    {
                      $cond: [
                        { $in: [{ $type: '$$v2' }, ['int', 'long', 'double', 'decimal']] },
                        '$$v2',
                        {
                          $convert: {
                            input: {
                              $cond: [
                                { $eq: [{ $type: '$$v2' }, 'string'] },
                                '$$v2',
                                { $toString: '$$v' },
                              ],
                            },
                            to: 'double',
                            onError: null,
                            onNull: null,
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
          {
            case: { $eq: ['$type', DeviceDataType.STRING] },
            then: {
              $let: {
                vars: { s: { $toLower: { $toString: '$valueRaw' } } },
                in: {
                  $cond: [
                    { $in: ['$$s', ['on', 'true', '1', 'yes']] },
                    1,
                    {
                      $cond: [
                        { $in: ['$$s', ['off', 'false', '0', 'no']] },
                        0,
                        null,
                      ],
                    },
                  ],
                },
              },
            },
          },
        ],
        default: null,
      },
    };

    const bucketTs = {
      $cond: {
        if: { $eq: ['$type', DeviceDataType.BOOLEAN] },
        then: {
          $dateTrunc: {
            date: '$timestamp',
            unit: boolBucket.unit,
            binSize: boolBucket.binSize,
          },
        },
        else: {
          $dateTrunc: {
            date: '$timestamp',
            unit: numericBucket.unit,
            binSize: numericBucket.binSize,
          },
        },
      },
    };

    const rows = await this.model
      .aggregate<{
        capability: string;
        attribute: string | null;
        unit: string | null;
        ts: Date;
        value: number;
      }>([
        { $match: match },
        {
          $project: {
            capability: 1,
            attribute: { $ifNull: ['$attribute', null] },
            unit: { $ifNull: ['$unit', null] },
            type: 1,
            valueRaw: '$value',
            timestamp: 1,
          },
        },
        {
          $addFields: {
            numeric: numericValue,
            bucket: bucketTs,
          },
        },
        { $match: { numeric: { $ne: null } } },
        { $sort: { timestamp: 1 } },
        {
          $group: {
            _id: {
              capability: '$capability',
              attribute: '$attribute',
              bucket: '$bucket',
            },
            unit: { $first: '$unit' },
            // For binary series, "last" better matches state timeline; for numeric use avg.
            last: { $last: '$numeric' },
            avg: { $avg: '$numeric' },
            types: { $addToSet: '$type' },
          },
        },
        {
          $project: {
            capability: '$_id.capability',
            attribute: '$_id.attribute',
            ts: '$_id.bucket',
            unit: 1,
            value: {
              $cond: [
                { $in: [DeviceDataType.BOOLEAN, '$types'] },
                '$last',
                '$avg',
              ],
            },
          },
        },
        { $sort: { ts: 1 } },
      ])
      .exec();

    const map = new Map<string, DeviceDataSeries>();
    for (const r of rows) {
      const key = `${r.capability}:${r.attribute ?? ''}`;
      const existing =
        map.get(key) ??
        ({
          key,
          capability: r.capability,
          attribute: r.attribute ?? null,
          unit: r.unit ?? null,
          points: [],
        } satisfies DeviceDataSeries);
      existing.points.push({ ts: r.ts, value: r.value });
      map.set(key, existing);
    }

    return { from, to, series: [...map.values()] };
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
