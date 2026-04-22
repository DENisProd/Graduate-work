import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import type { Subscription } from 'rxjs';
import {
  zigbeeSocketCommandSchema,
  zigbeeSocketSubscribeSchema,
} from './schemas/zigbee.schemas';
import { ZigbeeRealtimeService } from './zigbee-realtime.service';
import { ZigbeeService } from './zigbee.service';
import { ZigbeeStateRepository } from './zigbee-state.repository';
import { ZigbeeDeviceRepository } from './zigbee-device.repository';
import type { ZigbeeStateRealtimePayload } from './zigbee-realtime.service';

const PAIRING_ROOM = 'pairing';

function roomForIeee(ieee: string): string {
  return `zigbee:${ieee}`;
}

function corsOriginsFromEnv(): string[] {
  const raw =
    process.env.SCENARIO_CORS_ORIGINS ?? process.env.FRONTEND_ORIGIN ?? '';
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : ['http://localhost:3000'];
}

type SocketData = { zigbeeIeees?: Set<string> };

function trackedIeees(client: Socket): Set<string> {
  const d = client.data as SocketData;
  if (!d.zigbeeIeees) d.zigbeeIeees = new Set();
  return d.zigbeeIeees;
}

@WebSocketGateway({
  namespace: '/zigbee',
  cors: {
    origin: corsOriginsFromEnv(),
    credentials: true,
  },
})
export class ZigbeeRealtimeGateway
  implements OnModuleInit, OnModuleDestroy, OnGatewayInit
{
  private readonly logger = new Logger(ZigbeeRealtimeGateway.name);
  private sub?: Subscription;
  private pairingSub?: Subscription;
  private pairingStatusSub?: Subscription;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly realtime: ZigbeeRealtimeService,
    private readonly states: ZigbeeStateRepository,
    private readonly devices: ZigbeeDeviceRepository,
    private readonly zigbee: ZigbeeService,
  ) {}

  onModuleInit(): void {
    this.sub = this.realtime.stateUpdates$.subscribe((p) => {
      this.emitState(p);
    });
    this.pairingSub = this.zigbee.pairingEvents$.subscribe((event) => {
      this.server?.to(PAIRING_ROOM).emit('zigbee:pairing:event', event);
    });
    this.pairingStatusSub = this.zigbee.pairingStatus$.subscribe((status) => {
      this.server?.to(PAIRING_ROOM).emit('zigbee:pairing:status', status);
    });
  }

  afterInit(): void {
    this.logger.log('Socket.IO namespace /zigbee готов');
  }

  onModuleDestroy(): void {
    this.sub?.unsubscribe();
    this.pairingSub?.unsubscribe();
    this.pairingStatusSub?.unsubscribe();
  }

  private emitState(p: ZigbeeStateRealtimePayload): void {
    if (!this.server) return;
    const room = roomForIeee(p.deviceIeeeAddr);
    this.server.to(room).emit('zigbee:state', this.toWire(p));
  }

  private toWire(p: ZigbeeStateRealtimePayload) {
    return {
      deviceIeeeAddr: p.deviceIeeeAddr,
      physicalDeviceId: p.physicalDeviceId ?? null,
      friendlyName: p.friendlyName ?? null,
      timestamp:
        p.timestamp instanceof Date
          ? p.timestamp.toISOString()
          : String(p.timestamp),
      metrics: p.metrics,
      payload: p.payload,
      stateId: p.stateId,
    };
  }

  /**
   * Emits pairing events for all currently known Zigbee devices to a single client.
   * Devices with full data (model/capabilities) are emitted as interview_done so the
   * user can add them immediately. Devices with no data yet are emitted as joined.
   * Called when a client subscribes to the pairing room.
   */
  private async emitExistingDevicesToClient(client: Socket): Promise<void> {
    try {
      const { items } = await this.zigbee.listDevices({ page: 1, limit: 100 });
      for (const dev of items) {
        const fullyKnown =
          Boolean(dev.modelId) || (dev.capabilities?.length ?? 0) > 0;
        client.emit('zigbee:pairing:event', {
          type: fullyKnown ? 'interview_done' : 'joined',
          ieeeAddr: dev.ieeeAddr,
          friendlyName: dev.friendlyName ?? dev.ieeeAddr,
          physicalDeviceId: dev.physicalDeviceId,
          model: dev.modelId ?? null,
          manufacturer: dev.manufacturerName ?? null,
          capabilities: dev.capabilities ?? [],
          supported: fullyKnown,
        });
      }
    } catch (e) {
      this.logger.warn(
        `emitExistingDevicesToClient failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  private async resolveIeeeList(body: unknown): Promise<{
    ieees: string[];
    error?: string;
  }> {
    const parsed = zigbeeSocketSubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return {
        ieees: [],
        error: parsed.error.flatten().formErrors.join('; ') || 'Невалидное тело',
      };
    }
    const { deviceIeeeAddrs = [], physicalDeviceIds = [] } = parsed.data;
    const map = await this.devices.findIeeeAddrsByPhysicalIds(physicalDeviceIds);
    const fromIds = physicalDeviceIds
      .map((id) => map.get(id))
      .filter((x): x is string => typeof x === 'string' && x.length >= 3);
    const merged = [
      ...deviceIeeeAddrs.map((s) => s.trim()),
      ...fromIds.map((s) => s.trim()),
    ].filter((s) => s.length >= 3);
    const unique = [...new Set(merged)];
    return { ieees: unique };
  }

  @SubscribeMessage('zigbee:subscribe')
  async onSubscribe(client: Socket, body: unknown) {
    const { ieees, error } = await this.resolveIeeeList(body);
    if (error) return { ok: false as const, error };
    if (ieees.length === 0) {
      return { ok: false as const, error: 'Нет валидных устройств для подписки' };
    }

    const track = trackedIeees(client);
    for (const ieee of ieees) {
      track.add(ieee);
      await client.join(roomForIeee(ieee));
    }

    const latest = await this.states.findLatestByDeviceIeeeAddrs(ieees);
    const snapshotRows = await Promise.all(
      ieees.map(async (ieee) => {
        const st = latest.get(ieee);
        if (!st) return null;
        const dev = await this.devices.findByIeeeAddr(ieee);
        return this.toWire({
          deviceIeeeAddr: st.deviceIeeeAddr,
          physicalDeviceId: dev?.id ?? null,
          friendlyName: dev?.friendlyName ?? null,
          timestamp: st.timestamp,
          metrics: {
            state: st.state ?? null,
            brightness: st.brightness ?? null,
            linkquality: st.linkquality ?? null,
            colorMode: st.colorMode ?? null,
            occupancy: st.occupancy ?? null,
            temperature: st.temperature ?? null,
            humidity: st.humidity ?? null,
            battery: st.battery ?? null,
          },
          payload: st.payload,
          stateId: st.id,
        });
      }),
    );
    const snapshots = snapshotRows.filter(
      (x): x is NonNullable<typeof x> => x !== null,
    );

    return { ok: true as const, subscribed: ieees.length, snapshots };
  }

  /**
   * Команда управления устройством. Пример:
   * `{ deviceIeeeAddr: '0xabc…', payload: { state: 'ON' } }`
   */
  @SubscribeMessage('zigbee:command')
  async onCommand(_client: Socket, body: unknown) {
    const parsed = zigbeeSocketCommandSchema.safeParse(body);
    if (!parsed.success) {
      return {
        ok: false as const,
        error:
          parsed.error.flatten().formErrors.join('; ') || 'Невалидное тело',
      };
    }

    const { deviceIeeeAddr, physicalDeviceId, payload } = parsed.data;

    let ieeeAddr: string | undefined = deviceIeeeAddr;

    if (!ieeeAddr && physicalDeviceId) {
      const map = await this.devices.findIeeeAddrsByPhysicalIds([
        physicalDeviceId,
      ]);
      ieeeAddr = map.get(physicalDeviceId);
    }

    if (!ieeeAddr) {
      return { ok: false as const, error: 'Устройство не найдено' };
    }

    const result = await this.zigbee.sendCommand(
      ieeeAddr,
      payload as Record<string, unknown>,
    );
    return result;
  }

  /**
   * Подписаться на события сопряжения — войти в pairing-комнату —
   * БЕЗ включения permit_join. Вызывается при открытии модалки,
   * чтобы device_announce/joined/interview события приходили клиенту
   * даже до нажатия кнопки "Начать".
   * Сразу же отдаёт все уже известные устройства, чтобы модалка не была пустой.
   */
  @SubscribeMessage('zigbee:pairing:watch')
  async onPairingWatch(client: Socket) {
    await client.join(PAIRING_ROOM);
    void this.emitExistingDevicesToClient(client);
    return { ok: true as const };
  }

  /** Отписаться от событий сопряжения (без отключения permit_join). */
  @SubscribeMessage('zigbee:pairing:unwatch')
  async onPairingUnwatch(client: Socket) {
    await client.leave(PAIRING_ROOM);
    return { ok: true as const };
  }

  /**
   * Включить режим сопряжения (permit_join) и подписаться на события.
   * Клиент автоматически входит в комнату `pairing`.
   * Сразу же отдаёт все уже известные устройства.
   */
  @SubscribeMessage('zigbee:pairing:start')
  async onPairingStart(client: Socket, body: unknown) {
    const time =
      body !== null &&
      typeof body === 'object' &&
      typeof (body as Record<string, unknown>).time === 'number'
        ? Math.max(1, Math.min(254, Math.trunc((body as Record<string, unknown>).time as number)))
        : 254;
    await client.join(PAIRING_ROOM);
    void this.emitExistingDevicesToClient(client);
    const result = this.zigbee.permitJoin(true, time);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, time };
  }

  /** Выключить permit_join. Клиент остаётся в pairing-комнате (продолжает получать события). */
  @SubscribeMessage('zigbee:pairing:stop')
  async onPairingStop(client: Socket) {
    const result = this.zigbee.permitJoin(false);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const };
  }

  /**
   * Отписка: тело как у subscribe — снимаем только перечисленные устройства.
   * Пустое тело или `{}` — выйти из всех комнат zigbee для этого сокета.
   */
  @SubscribeMessage('zigbee:unsubscribe')
  async onUnsubscribe(client: Socket, body: unknown) {
    const track = trackedIeees(client);
    const empty =
      body === null ||
      body === undefined ||
      (typeof body === 'object' &&
        body !== null &&
        Object.keys(body as object).length === 0);
    if (empty) {
      for (const ieee of [...track]) {
        await client.leave(roomForIeee(ieee));
      }
      track.clear();
      return { ok: true as const, left: 'all' };
    }

    const { ieees, error } = await this.resolveIeeeList(body);
    if (error) return { ok: false as const, error };
    for (const ieee of ieees) {
      if (track.has(ieee)) {
        track.delete(ieee);
        await client.leave(roomForIeee(ieee));
      }
    }
    return { ok: true as const, left: ieees.length };
  }
}
