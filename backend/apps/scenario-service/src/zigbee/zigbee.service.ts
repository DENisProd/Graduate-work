import { Injectable } from '@nestjs/common';
import { DeviceDataService } from '../device-data/device-data.service';
import { ZigbeeDeviceLogSource } from '../mongo/schemas/zigbee-device-log.mongo';
import { ZigbeeDeviceLogRepository } from './zigbee-device-log.repository';
import {
  canonicalZigbeeIeeeAddr,
  ZigbeeDeviceRepository,
} from './zigbee-device.repository';
import { ZigbeeLinkRepository } from './zigbee-link.repository';
import { ZigbeeRealtimeService } from './zigbee-realtime.service';
import { ZigbeeStateRepository } from './zigbee-state.repository';
import { normalizeZigbeePayload } from './normalize-zigbee-payload';
import {
  ZigbeeDeviceType,
  type CreateZigbeeLinksBatchInput,
  type CreateZigbeeStateInput,
  type ListZigbeeDevicesQuery,
  type ListZigbeeLinksQuery,
  type ListZigbeeDeviceLogsQuery,
  type ListZigbeeStatesQuery,
  type UpsertZigbeeDeviceInput,
} from './schemas/zigbee.schemas';

@Injectable()
export class ZigbeeService {
  constructor(
    private readonly devices: ZigbeeDeviceRepository,
    private readonly states: ZigbeeStateRepository,
    private readonly links: ZigbeeLinkRepository,
    private readonly deviceLogs: ZigbeeDeviceLogRepository,
    private readonly realtime: ZigbeeRealtimeService,
    private readonly deviceData: DeviceDataService,
  ) {}

  upsertDevice(input: UpsertZigbeeDeviceInput) {
    return this.devices.upsertByIeeeAddr(input);
  }

  async createState(
    input: CreateZigbeeStateInput,
    options?: { logSource?: ZigbeeDeviceLogSource },
  ) {
    const normalized = normalizeZigbeePayload(input.payload);
    const created = await this.states.create({
      ...input,
      state: input.state ?? normalized.state,
      brightness: input.brightness ?? normalized.brightness,
      linkquality: input.linkquality ?? normalized.linkquality,
      colorMode: input.colorMode ?? normalized.colorMode,
      occupancy: input.occupancy ?? normalized.occupancy,
      temperature: input.temperature ?? normalized.temperature,
      humidity: input.humidity ?? normalized.humidity,
      battery: input.battery ?? normalized.battery,
    });

    const logSource = options?.logSource ?? ZigbeeDeviceLogSource.Api;
    const device = await this.devices.findByIeeeAddr(input.deviceIeeeAddr);
    const payloadKeys = Object.keys(input.payload).slice(0, 64);

    await this.deviceLogs.appendFromState({
      state: created,
      physicalDeviceId: device?.id ?? null,
      source: logSource,
      payloadKeys,
    });

    this.realtime.publishStateUpdate(created, {
      physicalDeviceId: device?.id ?? null,
      friendlyName: device?.friendlyName ?? null,
      payload: input.payload,
    });

    return created;
  }

  listDeviceLogs(query: ListZigbeeDeviceLogsQuery) {
    return this.deviceLogs.findMany(query);
  }

  createLinksBatch(input: CreateZigbeeLinksBatchInput) {
    return this.links.createMany({
      collectedAt: input.collectedAt,
      links: input.links,
    });
  }

  listDevices(query: ListZigbeeDevicesQuery) {
    return this.devices.findMany(query);
  }

  getDeviceByIeeeAddr(ieeeAddr: string) {
    return this.devices.findByIeeeAddr(ieeeAddr);
  }

  listStates(query: ListZigbeeStatesQuery) {
    return this.states.findMany(query);
  }

  listLinks(query: ListZigbeeLinksQuery) {
    return this.links.findMany(query);
  }

  /**
   * События zigbee2mqtt/bridge/event (появление устройства, интервью и т.д.).
   */
  async applyBridgeEvent(payload: Record<string, unknown>): Promise<void> {
    const eventType = payload.type;
    if (typeof eventType !== 'string') return;

    const data = payload.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;
    const d = data as Record<string, unknown>;

    const ieeeRaw = d.ieee_address ?? d.ieeeAddr;
    if (typeof ieeeRaw !== 'string' || ieeeRaw.length < 3) return;

    const fn = d.friendly_name ?? d.friendlyName;
    const friendlyName = typeof fn === 'string' ? fn : undefined;

    switch (eventType) {
      case 'device_announce':
      case 'device_joined':
      case 'device_interview':
      case 'interview_successful':
        await this.upsertDevice({
          ieeeAddr: ieeeRaw,
          friendlyName,
        });
        break;
      default:
        break;
    }
  }

  /**
   * Синхронизация устройств из retained-сообщения zigbee2mqtt/bridge/devices.
   */
  async syncDevicesFromZigbee2MqttBridge(list: unknown): Promise<void> {
    if (!Array.isArray(list)) return;

    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const ieeeRaw = o.ieee_address ?? o.ieeeAddr;
      if (typeof ieeeRaw !== 'string' || ieeeRaw.length < 3) continue;

      const fn = o.friendly_name ?? o.friendlyName;
      const friendlyName = typeof fn === 'string' ? fn : undefined;

      const typeRaw = o.type;
      let type: ZigbeeDeviceType | undefined;
      if (
        typeof typeRaw === 'string' &&
        (Object.values(ZigbeeDeviceType) as string[]).includes(typeRaw)
      ) {
        type = typeRaw as ZigbeeDeviceType;
      }

      const net = o.network_address ?? o.networkAddress;
      const networkAddress =
        typeof net === 'number' && Number.isFinite(net)
          ? net
          : typeof net === 'string' && net.trim() !== ''
            ? Number(net)
            : undefined;

      const manufacturerName =
        typeof o.manufacturer === 'string'
          ? o.manufacturer
          : typeof o.manufacturerName === 'string'
            ? o.manufacturerName
            : undefined;

      const modelId =
        typeof o.model_id === 'string'
          ? o.model_id
          : typeof o.modelID === 'string'
            ? o.modelID
            : undefined;

      const definition =
        typeof o.definition === 'object' &&
        o.definition !== null &&
        !Array.isArray(o.definition)
          ? (o.definition as Record<string, unknown>)
          : undefined;

      let lastSeen: Date | undefined;
      const ls = o.last_seen ?? o.lastSeen;
      if (typeof ls === 'string' && ls.trim() !== '') {
        const t = Date.parse(ls);
        if (!Number.isNaN(t)) lastSeen = new Date(t);
      } else if (typeof ls === 'number' && Number.isFinite(ls)) {
        lastSeen = new Date(ls);
      }

      const capabilities = capabilitiesFromBridgeDefinition(definition);

      await this.devices.upsertByIeeeAddr({
        ieeeAddr: ieeeRaw,
        friendlyName,
        type,
        networkAddress:
          networkAddress !== undefined && Number.isFinite(networkAddress)
            ? Math.trunc(networkAddress)
            : undefined,
        manufacturerName,
        modelId,
        definition,
        ...(lastSeen !== undefined ? { lastSeen } : {}),
        ...(capabilities ? { capabilities } : {}),
      });
    }
  }

  /**
   * Состояние с топика `zigbee2mqtt/<имя>`.
   * Имя часто совпадает с IEEE (`0x` + 16 hex), а не только с human-friendly_name.
   */
  async ingestMqttDeviceState(
    topicSegment: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    let ieeeAddr: string | undefined;

    const byName = await this.devices.findByFriendlyName(topicSegment);
    if (byName) ieeeAddr = byName.ieeeAddr;

    if (!ieeeAddr) {
      const fromTopic = ieeeAddrFromZ2mTopicName(topicSegment);
      if (fromTopic) ieeeAddr = fromTopic;
    }

    if (!ieeeAddr) {
      const byIeee = await this.devices.findByIeeeAddr(topicSegment);
      if (byIeee) ieeeAddr = byIeee.ieeeAddr;
    }

    if (!ieeeAddr) ieeeAddr = extractIeeeFromZigbeePayload(payload);
    if (!ieeeAddr) return;

    ieeeAddr = canonicalZigbeeIeeeAddr(ieeeAddr);

    let device = await this.devices.findByIeeeAddr(ieeeAddr);
    if (!device) {
      await this.devices.upsertByIeeeAddr({
        ieeeAddr,
        ...(ieeeAddrFromZ2mTopicName(topicSegment) === undefined &&
        topicSegment.trim().length > 0
          ? { friendlyName: topicSegment.trim() }
          : {}),
      });
      device = await this.devices.findByIeeeAddr(ieeeAddr);
    }

    await this.devices.touchLastSeen(ieeeAddr);

    const created = await this.createState(
      { deviceIeeeAddr: ieeeAddr, payload },
      { logSource: ZigbeeDeviceLogSource.Mqtt },
    );

    const dev = device ?? (await this.devices.findByIeeeAddr(ieeeAddr));
    if (dev) {
      await this.deviceData.ingestFromZigbeePayload(
        dev.id,
        payload,
        created.timestamp,
      );
    }
  }
}

function collectExposedProperties(node: unknown, out: Set<string>): void {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (const x of node) collectExposedProperties(x, out);
    return;
  }
  if (typeof node !== 'object') return;
  const o = node as Record<string, unknown>;
  const prop = o.property;
  if (typeof prop === 'string' && prop.length > 0) {
    out.add(prop);
  } else if (
    typeof o.name === 'string' &&
    o.name.length > 0 &&
    typeof o.type === 'string' &&
    o.type !== 'composite' &&
    o.type !== 'light'
  ) {
    out.add(o.name);
  }
  for (const k of ['features', 'items', 'endpoints', 'values']) {
    if (k in o && o[k] !== undefined) {
      collectExposedProperties(o[k], out);
    }
  }
}

function capabilitiesFromBridgeDefinition(
  definition: Record<string, unknown> | undefined,
): string[] | undefined {
  if (!definition || !Array.isArray(definition.exposes)) return undefined;
  const s = new Set<string>();
  collectExposedProperties(definition.exposes, s);
  const arr = [...s].sort();
  return arr.length > 0 ? arr : undefined;
}

function ieeeAddrFromZ2mTopicName(segment: string): string | undefined {
  const t = segment.trim();
  if (!/^0x[0-9a-fA-F]{16}$/i.test(t)) return undefined;
  return canonicalZigbeeIeeeAddr(t);
}

function extractIeeeFromZigbeePayload(
  p: Record<string, unknown>,
): string | undefined {
  const top = p.ieee_address ?? p.ieeeAddress ?? p.ieee;
  if (typeof top === 'string' && top.length >= 3) return top;
  const dev = p.device;
  if (dev && typeof dev === 'object' && !Array.isArray(dev)) {
    const d = dev as Record<string, unknown>;
    const nested = d.ieeeAddress ?? d.ieee_address ?? d.ieee;
    if (typeof nested === 'string' && nested.length >= 3) return nested;
  }
  return undefined;
}
