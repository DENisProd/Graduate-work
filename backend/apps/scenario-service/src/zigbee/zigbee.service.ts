import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { DeviceDataService } from '../device-data/device-data.service';
import { DeviceCatalogService } from '../device-catalog/device-catalog.service';
import { ZigbeeDeviceLogSource } from '../mongo/schemas/zigbee-device-log.mongo';
import { ZigbeeDeviceLogRepository } from './zigbee-device-log.repository';
import {
  canonicalZigbeeIeeeAddr,
  ZigbeeDevice,
  ZigbeeDeviceRepository,
} from './zigbee-device.repository';
import { ZigbeeLinkRepository } from './zigbee-link.repository';
import { ZigbeeMqttService } from './zigbee-mqtt.service';
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

export interface DeviceStateEvent {
  houseId: string | null;
  friendlyName: string;
  ieeeAddr: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export interface ZigbeePairingEvent {
  type: 'joined' | 'interview_started' | 'interview_done' | 'interview_failed';
  ieeeAddr: string;
  friendlyName: string;
  supported?: boolean;
  definition?: Record<string, unknown> | null;
  capabilities?: string[];
  physicalDeviceId?: string | null;
  model?: string | null;
  manufacturer?: string | null;
}

export interface ZigbeePairingStatus {
  permitJoin: boolean;
  timeout?: number | null;
}

const DELETED_DEVICE_TTL_MS = 120_000;

@Injectable()
export class ZigbeeService {
  private readonly logger = new Logger(ZigbeeService.name);
  readonly pairingEvents$ = new Subject<ZigbeePairingEvent>();
  readonly pairingStatus$ = new Subject<ZigbeePairingStatus>();
  readonly deviceState$ = new Subject<DeviceStateEvent>();

  // TTL map that blocks auto-recreation of a device from incoming MQTT packets after deletion
  private readonly recentlyDeleted = new Map<string, number>();

  constructor(
    private readonly devices: ZigbeeDeviceRepository,
    private readonly states: ZigbeeStateRepository,
    private readonly links: ZigbeeLinkRepository,
    private readonly deviceLogs: ZigbeeDeviceLogRepository,
    private readonly realtime: ZigbeeRealtimeService,
    private readonly deviceData: DeviceDataService,
    private readonly catalogService: DeviceCatalogService,
    @Inject(forwardRef(() => ZigbeeMqttService))
    private readonly mqtt: ZigbeeMqttService,
  ) {}

  private markDeleted(canonical: string): void {
    this.recentlyDeleted.set(canonical, Date.now() + DELETED_DEVICE_TTL_MS);
  }

  private isRecentlyDeleted(canonical: string): boolean {
    const expiry = this.recentlyDeleted.get(canonical);
    if (expiry === undefined) return false;
    if (Date.now() > expiry) {
      this.recentlyDeleted.delete(canonical);
      return false;
    }
    return true;
  }

  async upsertDevice(input: UpsertZigbeeDeviceInput) {
    this.logger.debug(
      `[upsertDevice] START ieeeAddr=${input.ieeeAddr} model=${input.modelId ?? '?'} capabilities=[${(input.capabilities ?? []).join(', ')}]`,
    );
    const device = await this.devices.upsertByIeeeAddr(input);
    this.logger.debug(
      `[upsertDevice] upserted id=${device.id} ieeeAddr=${device.ieeeAddr} existing deviceId=${device.deviceId ?? 'null'}`,
    );
    await this.enrichDeviceCatalogLinks(device, input);
    return this.devices
      .findByIeeeAddr(device.ieeeAddr)
      .then((v) => v ?? device);
  }

  private async enrichDeviceCatalogLinks(
    device: ZigbeeDevice,
    input: UpsertZigbeeDeviceInput,
  ): Promise<void> {
    const model = input.modelId ?? device.modelId;
    const manufacturer = input.manufacturerName ?? device.manufacturerName;
    this.logger.log(
      `[catalog-enrich] START ieeeAddr=${device.ieeeAddr} model=${model ?? '?'} manufacturer=${manufacturer ?? '?'}`,
    );
    try {
      const synced = await this.catalogService.syncWithCatalog({
        manufacturerName: manufacturer,
        model,
        definition: input.definition ?? device.definition,
        friendlyName: input.friendlyName ?? device.friendlyName,
        ieeeAddr: input.ieeeAddr ?? device.ieeeAddr,
      });

      this.logger.log(
        `[catalog-enrich] syncWithCatalog result: deviceTypeId=${synced.deviceTypeId ?? 'null'} deviceId=${synced.deviceId ?? 'null'} deviceCategoryId=${synced.deviceCategoryId ?? 'null'}`,
      );

      if (!synced.deviceId || !synced.deviceCategoryId) {
        this.logger.warn(
          `[catalog-enrich] SKIP ieeeAddr=${device.ieeeAddr}: catalog returned no deviceId or deviceCategoryId`,
        );
        return;
      }
      if (
        device.deviceId === synced.deviceId &&
        device.deviceCategoryId === synced.deviceCategoryId
      ) {
        this.logger.debug(
          `[catalog-enrich] NO CHANGE ieeeAddr=${device.ieeeAddr}: catalog IDs already up-to-date (deviceId=${synced.deviceId}, deviceCategoryId=${synced.deviceCategoryId})`,
        );
        return;
      }

      this.logger.log(
        `[catalog-enrich] SAVING ieeeAddr=${device.ieeeAddr}: deviceId=${synced.deviceId} deviceCategoryId=${synced.deviceCategoryId}`,
      );
      await this.devices.upsertByIeeeAddr({
        ieeeAddr: device.ieeeAddr,
        deviceId: synced.deviceId,
        deviceCategoryId: synced.deviceCategoryId,
      });
      this.logger.log(
        `[catalog-enrich] DONE ieeeAddr=${device.ieeeAddr}: catalog IDs persisted`,
      );
    } catch (error) {
        // Catalog links are best-effort — must not break Zigbee ingestion on failure
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `catalog-link-enrich failed for ${device.ieeeAddr}: ${message}`,
      );
    }
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

  permitJoin(
    houseId: string,
    enable: boolean,
    time = 254,
  ): { ok: true } | { ok: false; error: string } {
    return this.mqtt.permitJoin(houseId, enable, time);
  }

  emitPairingStatus(status: ZigbeePairingStatus): void {
    this.pairingStatus$.next(status);
  }

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

    if (this.isRecentlyDeleted(canonicalZigbeeIeeeAddr(ieeeRaw))) return;

    switch (eventType) {
      case 'device_announce': {
        await this.upsertDevice({ ieeeAddr: ieeeRaw, friendlyName });
        const annDev = await this.devices.findByIeeeAddr(ieeeRaw);
        if (annDev?.type === ZigbeeDeviceType.Coordinator) break;
        const fullyKnown =
          Boolean(annDev?.modelId) || (annDev?.capabilities?.length ?? 0) > 0;
        this.pairingEvents$.next({
          type: fullyKnown ? 'interview_done' : 'joined',
          ieeeAddr: ieeeRaw,
          friendlyName: friendlyName ?? ieeeRaw,
          physicalDeviceId: annDev?.id ?? null,
          model: annDev?.modelId ?? null,
          manufacturer: annDev?.manufacturerName ?? null,
          capabilities: annDev?.capabilities ?? [],
          supported: fullyKnown,
        });
        break;
      }

      case 'device_joined': {
        await this.upsertDevice({ ieeeAddr: ieeeRaw, friendlyName });
        const dev = await this.devices.findByIeeeAddr(ieeeRaw);
        if (dev?.type === ZigbeeDeviceType.Coordinator) break;
        this.pairingEvents$.next({
          type: 'joined',
          ieeeAddr: ieeeRaw,
          friendlyName: friendlyName ?? ieeeRaw,
          physicalDeviceId: dev?.id ?? null,
        });
        break;
      }

      case 'device_interview': {
        const status = d.status;
        await this.upsertDevice({ ieeeAddr: ieeeRaw, friendlyName });

        if (status === 'started') {
          const dev = await this.devices.findByIeeeAddr(ieeeRaw);
          if (dev?.type === ZigbeeDeviceType.Coordinator) break;
          this.pairingEvents$.next({
            type: 'interview_started',
            ieeeAddr: ieeeRaw,
            friendlyName: friendlyName ?? ieeeRaw,
            physicalDeviceId: dev?.id ?? null,
          });
        } else if (status === 'successful') {
          const defRaw = d.definition;
          const definition =
            defRaw && typeof defRaw === 'object' && !Array.isArray(defRaw)
              ? (defRaw as Record<string, unknown>)
              : null;
          const capabilities = definition
            ? capabilitiesFromBridgeDefinition(definition)
            : undefined;
          const manufacturerRaw = d.manufacturer ?? definition?.vendor;
          const manufacturer =
            typeof manufacturerRaw === 'string' ? manufacturerRaw : null;
          const modelRaw = d.model_id ?? d.modelID ?? definition?.model;
          const model = typeof modelRaw === 'string' ? modelRaw : null;

          await this.upsertDevice({
            ieeeAddr: ieeeRaw,
            friendlyName,
            ...(definition ? { definition } : {}),
            ...(capabilities ? { capabilities } : {}),
            ...(manufacturer ? { manufacturerName: manufacturer } : {}),
            ...(model ? { modelId: model } : {}),
          });
          const dev = await this.devices.findByIeeeAddr(ieeeRaw);
          if (dev?.type === ZigbeeDeviceType.Coordinator) break;
          this.pairingEvents$.next({
            type: 'interview_done',
            ieeeAddr: ieeeRaw,
            friendlyName: friendlyName ?? ieeeRaw,
            supported: Boolean(d.supported),
            definition,
            capabilities: capabilities ?? [],
            physicalDeviceId: dev?.id ?? null,
            model: dev?.modelId ?? model,
            manufacturer: dev?.manufacturerName ?? manufacturer,
          });
        } else if (status === 'failed') {
          const dev = await this.devices.findByIeeeAddr(ieeeRaw);
          if (dev?.type === ZigbeeDeviceType.Coordinator) break;
          this.pairingEvents$.next({
            type: 'interview_failed',
            ieeeAddr: ieeeRaw,
            friendlyName: friendlyName ?? ieeeRaw,
            physicalDeviceId: dev?.id ?? null,
          });
        }
        break;
      }

      case 'interview_successful': {
        // older Z2M format (pre-1.x)
        await this.upsertDevice({ ieeeAddr: ieeeRaw, friendlyName });
        const dev = await this.devices.findByIeeeAddr(ieeeRaw);
        if (dev?.type === ZigbeeDeviceType.Coordinator) break;
        this.pairingEvents$.next({
          type: 'interview_done',
          ieeeAddr: ieeeRaw,
          friendlyName: friendlyName ?? ieeeRaw,
          supported: true,
          physicalDeviceId: dev?.id ?? null,
        });
        break;
      }

      default:
        break;
    }
  }

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

      await this.upsertDevice({
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

  async removeDevice(
    ieeeAddr: string,
    force = true,
  ): Promise<
    { ok: true; device: ZigbeeDevice } | { ok: false; error: string }
  > {
    const canonical = canonicalZigbeeIeeeAddr(ieeeAddr);
    const device = await this.devices.findByIeeeAddr(canonical);
    if (!device) {
      return { ok: false, error: `Устройство ${ieeeAddr} не найдено` };
    }

    this.markDeleted(canonical);

    // force=true: bridge removes the device entry immediately without waiting for the
    // device to respond — necessary for sleeping battery-powered devices
    if (device.houseId) {
      this.mqtt.removeDevice(device.houseId, device.friendlyName ?? canonical, force);
    }

    await Promise.all([
      this.devices.deleteByIeeeAddr(canonical),
      this.states.deleteManyByIeeeAddr(canonical),
      this.deviceLogs.deleteManyByIeeeAddr(canonical),
    ]);

    return { ok: true, device };
  }

  async sendCommand(
    ieeeAddr: string,
    payload: Record<string, unknown>,
  ): Promise<{ ok: true; topic: string } | { ok: false; error: string }> {
    const device = await this.devices.findByIeeeAddr(ieeeAddr);
    if (!device) {
      return { ok: false, error: `Устройство ${ieeeAddr} не найдено` };
    }
    if (!device.houseId) {
      return { ok: false, error: 'Устройство не привязано к дому (houseId отсутствует)' };
    }
    const topicName = device.friendlyName ?? device.ieeeAddr;
    return this.mqtt.sendDeviceCommand(device.houseId, topicName, payload);
  }

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

    if (this.isRecentlyDeleted(ieeeAddr)) return;

    let device = await this.devices.findByIeeeAddr(ieeeAddr);
    if (!device) {
      await this.upsertDevice({
        ieeeAddr,
        ...(ieeeAddrFromZ2mTopicName(topicSegment) === undefined &&
        topicSegment.trim().length > 0
          ? { friendlyName: topicSegment.trim() }
          : {}),
      });
      device = await this.devices.findByIeeeAddr(ieeeAddr);

      // Some Z2M setups don't emit bridge/event for joins; emit a pairing event
      // on first telemetry so the UI pairing modal can pick up the device
      if (device && device.type !== ZigbeeDeviceType.Coordinator) {
        this.pairingEvents$.next({
          type: 'joined',
          ieeeAddr: device.ieeeAddr,
          friendlyName: device.friendlyName ?? device.ieeeAddr,
          physicalDeviceId: device.id,
          model: device.modelId ?? null,
          manufacturer: device.manufacturerName ?? null,
          capabilities: device.capabilities ?? [],
          supported:
            Boolean(device.modelId) || (device.capabilities?.length ?? 0) > 0,
        });
      }
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

    this.deviceState$.next({
      houseId: dev?.houseId ?? null,
      friendlyName: topicSegment,
      ieeeAddr,
      payload,
      timestamp: created.timestamp,
    });
  }

  sendCommandToFriendlyName(
    houseId: string,
    friendlyName: string,
    args: Record<string, unknown>,
  ): { ok: true; topic: string } | { ok: false; error: string } {
    return this.mqtt.sendDeviceCommand(houseId, friendlyName, args);
  }

  async getLatestStateByFriendlyName(
    friendlyName: string,
  ): Promise<Record<string, unknown> | null> {
    const device = await this.devices.findByFriendlyName(friendlyName);
    if (!device) return null;
    const stateMap = await this.states.findLatestByDeviceIeeeAddrs([
      device.ieeeAddr,
    ]);
    return (
      (stateMap.get(device.ieeeAddr)?.payload as Record<string, unknown>) ??
      null
    );
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
