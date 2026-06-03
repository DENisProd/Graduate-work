import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import {
  PHYSICAL_DEVICE_MODEL,
  PhysicalDeviceModel,
} from '../mongo/schemas/physical-device.mongo';
import {
  SCENARIO_MODEL,
  ScenarioModel,
} from '../mongo/schemas/scenario.mongo';
import {
  ZIGBEE_DEVICE_LOG_MODEL,
  ZigbeeDeviceLogModel,
} from '../mongo/schemas/zigbee-device-log.mongo';
import { ScenarioStatus } from '../common/schemas/enums';

export type DashboardEventWire = {
  id: string;
  timestamp: string;
  houseId: string;
  deviceName: string;
  action: string;
  result: 'SUCCESS' | 'DENIED' | 'ERROR';
};

export type DashboardOverviewResponse = {
  totalDevices: number;
  totalActiveScenarios: number;
  eventsCount: number;
  recentEvents: DashboardEventWire[];
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(PHYSICAL_DEVICE_MODEL)
    private readonly physicalDeviceModel: Model<PhysicalDeviceModel>,
    @InjectModel(SCENARIO_MODEL)
    private readonly scenarioModel: Model<ScenarioModel>,
    @InjectModel(ZIGBEE_DEVICE_LOG_MODEL)
    private readonly deviceLogModel: Model<ZigbeeDeviceLogModel>,
  ) {}

  async getOverview(params: {
    houseIds: string[];
    from?: Date;
    limit: number;
  }): Promise<DashboardOverviewResponse> {
    const houseIds = [...new Set(params.houseIds.map(String))].filter(Boolean);
    if (houseIds.length === 0) {
      return {
        totalDevices: 0,
        totalActiveScenarios: 0,
        eventsCount: 0,
        recentEvents: [],
      };
    }

    const from = params.from ?? new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalDevices, totalActiveScenarios, physicalDevices] =
      await Promise.all([
        this.physicalDeviceModel
          .countDocuments({ houseId: { $in: houseIds } })
          .exec(),
        this.scenarioModel
          .countDocuments({
            houseId: { $in: houseIds },
            status: ScenarioStatus.ONLINE,
          })
          .exec(),
        this.physicalDeviceModel
          .find(
            { houseId: { $in: houseIds } },
            {
              _id: 1,
              houseId: 1,
              name: 1,
              friendlyName: 1,
              protocolAddress: 1,
            },
          )
          .limit(5000)
          .exec(),
      ]);

    const physicalIdToMeta = new Map<
      string,
      { houseId: string; deviceName: string; protocolAddress?: string | null }
    >();
    const ieeeToPhysicalId = new Map<string, string>();

    for (const d of physicalDevices) {
      const id = (d as unknown as { _id: Types.ObjectId })._id.toHexString();
      const houseId = String(
        (d as unknown as { houseId?: unknown }).houseId ?? '',
      );
      const protocolAddress = (d as unknown as { protocolAddress?: unknown })
        .protocolAddress as string | null | undefined;
      const friendlyName = (d as unknown as { friendlyName?: unknown })
        .friendlyName as string | undefined;
      const name = (d as unknown as { name?: unknown }).name as
        | string
        | undefined;

      const deviceName =
        (friendlyName && friendlyName.trim()) ||
        (name && name.trim()) ||
        protocolAddress ||
        id;

      physicalIdToMeta.set(id, { houseId, deviceName, protocolAddress });
      if (protocolAddress) {
        ieeeToPhysicalId.set(String(protocolAddress), id);
      }
    }

    const physicalIds = [...physicalIdToMeta.keys()];
    const ieeeAddrs = [...ieeeToPhysicalId.keys()];

    const logFilter: Record<string, unknown> = {
      timestamp: { $gte: from },
      $or: [
        ...(physicalIds.length
          ? [{ physicalDeviceId: { $in: physicalIds } }]
          : []),
        ...(ieeeAddrs.length ? [{ deviceIeeeAddr: { $in: ieeeAddrs } }] : []),
      ],
    };

    if ((logFilter.$or as unknown[]).length === 0) {
      return {
        totalDevices,
        totalActiveScenarios,
        eventsCount: 0,
        recentEvents: [],
      };
    }

    const [eventsCount, logs] = await Promise.all([
      this.deviceLogModel.countDocuments(logFilter).exec(),
      this.deviceLogModel
        .find(logFilter)
        .sort({ timestamp: -1 })
        .limit(params.limit)
        .exec(),
    ]);

    const recentEvents: DashboardEventWire[] = logs.map((doc) => {
      const o = doc.toObject() as unknown as {
        _id: Types.ObjectId;
        timestamp?: Date;
        createdAt?: Date;
        deviceIeeeAddr?: string;
        physicalDeviceId?: string | null;
        kind?: string;
        source?: string;
      };

      const physicalId =
        (o.physicalDeviceId ?? null) ||
        (o.deviceIeeeAddr ? ieeeToPhysicalId.get(String(o.deviceIeeeAddr)) : null) ||
        null;

      const meta = physicalId ? physicalIdToMeta.get(physicalId) : undefined;
      const houseId = meta?.houseId ?? '';
      const deviceName =
        meta?.deviceName ??
        String(o.deviceIeeeAddr ?? o.physicalDeviceId ?? '—');
      const action = String(o.kind ?? o.source ?? '');

      return {
        id: o._id.toHexString(),
        timestamp: (o.timestamp ?? o.createdAt ?? new Date()).toISOString(),
        houseId,
        deviceName,
        action,
        result: 'SUCCESS',
      };
    });

    return {
      totalDevices,
      totalActiveScenarios,
      eventsCount,
      recentEvents,
    };
  }
}

