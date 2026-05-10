import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as mqtt from 'mqtt';
import type { IClientOptions, MqttClient } from 'mqtt';
import { ZigbeeIngestService } from './zigbee-ingest.service';
import { HouseMqttConfigRepository, HouseMqttConfig } from './house-mqtt-config.repository';

interface ConnectionEntry {
  client: MqttClient;
  topicPrefix: string;
  houseId: string;
}

@Injectable()
export class ZigbeeMqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ZigbeeMqttService.name);
  private readonly connections = new Map<string, ConnectionEntry>();

  constructor(
    private readonly configRepo: HouseMqttConfigRepository,
    @Inject(forwardRef(() => ZigbeeIngestService))
    private readonly ingest: ZigbeeIngestService,
  ) {}

  async onModuleInit(): Promise<void> {
    const configs = await this.configRepo.findAll();
    for (const config of configs) {
      if (config.enabled) {
        this.connect(config);
      }
    }
  }

  onModuleDestroy(): void {
    for (const entry of this.connections.values()) {
      // Avoid crashing the process if the client emits 'error' while shutting down.
      entry.client.on('error', () => {});
      entry.client.removeAllListeners('connect');
      entry.client.removeAllListeners('message');
      entry.client.removeAllListeners('reconnect');
      entry.client.removeAllListeners('close');
      entry.client.removeAllListeners('offline');
      entry.client.end(true);
    }
    this.connections.clear();
  }

  connect(config: HouseMqttConfig): void {
    this.disconnectHouse(config.houseId);

    const topicPrefix = config.topicPrefix.replace(/\/+$/, '');

    const opts: IClientOptions = {
      reconnectPeriod: 5000,
      connectTimeout: 10_000,
      clientId: `scenario-${config.houseId.slice(0, 8)}-${Math.random().toString(36).slice(2, 8)}`,
    };
    if (config.mqttUsername) opts.username = config.mqttUsername;
    if (config.mqttPassword) opts.password = config.mqttPassword;

    const client = mqtt.connect(config.mqttUrl, opts);
    const entry: ConnectionEntry = { client, topicPrefix, houseId: config.houseId };
    this.connections.set(config.houseId, entry);

    client.on('connect', () => {
      this.logger.log(`[${config.houseId}] MQTT подключён: ${config.mqttUrl}`);
      const pattern = `${topicPrefix}/#`;
      client.subscribe(pattern, { qos: 0 }, (err) => {
        if (err) {
          this.logger.error(`[${config.houseId}] Подписка не удалась: ${pattern}`, err);
          return;
        }
        this.logger.log(`[${config.houseId}] Подписка: ${pattern}`);
        this.requestBridgeDeviceList(config.houseId);
      });
    });

    client.on('message', (topic, payload) => {
      this.logIncoming(config.houseId, topic, payload);
      void this.ingest.processMqttMessage(config.houseId, topicPrefix, topic, payload);
    });

    client.on('error', (err) => {
      this.logger.error(`[${config.houseId}] MQTT ошибка`, err);
    });

    client.on('reconnect', () => {
      this.logger.warn(`[${config.houseId}] MQTT переподключение…`);
    });
  }

  disconnectHouse(houseId: string): void {
    const existing = this.connections.get(houseId);
    if (existing) {
      // mqtt.js can still emit late 'error' (e.g. connack timeout) after end().
      // Keep a noop error handler to prevent Node "Unhandled 'error' event".
      existing.client.on('error', () => {});
      existing.client.removeAllListeners('connect');
      existing.client.removeAllListeners('message');
      existing.client.removeAllListeners('reconnect');
      existing.client.removeAllListeners('close');
      existing.client.removeAllListeners('offline');
      existing.client.end(true);
      this.connections.delete(houseId);
    }
  }

  getConnectionStatus(houseId: string): { connected: boolean; url?: string } {
    const entry = this.connections.get(houseId);
    if (!entry) return { connected: false };
    return { connected: entry.client.connected };
  }

  getAllStatuses(): Record<string, { connected: boolean }> {
    const result: Record<string, { connected: boolean }> = {};
    for (const [houseId, entry] of this.connections.entries()) {
      result[houseId] = { connected: entry.client.connected };
    }
    return result;
  }

  requestBridgeDeviceList(houseId: string): { ok: true } | { ok: false; error: string } {
    const entry = this.connections.get(houseId);
    if (!entry?.client.connected) {
      return { ok: false, error: `MQTT не подключён для дома ${houseId}` };
    }
    const topic = `${entry.topicPrefix}/bridge/request/devices`;
    entry.client.publish(topic, '{}', { qos: 0 }, (err) => {
      if (err) this.logger.error(`[${houseId}] Ошибка publish ${topic}`, err);
    });
    this.logger.log(`[${houseId}] Запрос списка устройств: ${topic}`);
    return { ok: true };
  }

  permitJoin(
    houseId: string,
    enable: boolean,
    time = 254,
  ): { ok: true } | { ok: false; error: string } {
    const entry = this.connections.get(houseId);
    if (!entry?.client.connected) {
      return { ok: false, error: `MQTT не подключён для дома ${houseId}` };
    }
    const topic = `${entry.topicPrefix}/bridge/request/permit_join`;
    const t = Math.max(1, Math.min(254, Math.trunc(time)));
    const body = enable ? String(t) : 'false';
    entry.client.publish(topic, body, { qos: 0 }, (err) => {
      if (err) this.logger.error(`[${houseId}] Ошибка publish ${topic}`, err);
    });
    this.logger.log(`[${houseId}] MQTT → ${topic}\n${body}`);
    return { ok: true };
  }

  removeDevice(
    houseId: string,
    idOrName: string,
    force = false,
  ): { ok: true } | { ok: false; error: string } {
    const entry = this.connections.get(houseId);
    if (!entry?.client.connected) {
      return { ok: false, error: `MQTT не подключён для дома ${houseId}` };
    }
    const topic = `${entry.topicPrefix}/bridge/request/device/remove`;
    const body = JSON.stringify({ id: idOrName, force });
    entry.client.publish(topic, body, { qos: 0 }, (err) => {
      if (err) this.logger.error(`[${houseId}] Ошибка publish ${topic}`, err);
    });
    this.logger.log(`[${houseId}] MQTT → ${topic}\n${body}`);
    return { ok: true };
  }

  sendDeviceCommand(
    houseId: string,
    topicName: string,
    payload: Record<string, unknown>,
  ): { ok: true; topic: string } | { ok: false; error: string } {
    const entry = this.connections.get(houseId);
    if (!entry?.client.connected) {
      return { ok: false, error: `MQTT не подключён для дома ${houseId}` };
    }
    const topic = `${entry.topicPrefix}/${topicName}/set`;
    const body = JSON.stringify(payload);
    entry.client.publish(topic, body, { qos: 0 }, (err) => {
      if (err) this.logger.error(`[${houseId}] Ошибка publish ${topic}`, err);
    });
    this.logger.log(`[${houseId}] MQTT → ${topic}\n${body}`);
    return { ok: true, topic };
  }

  private logIncoming(houseId: string, topic: string, payload: Buffer): void {
    const raw = payload.toString();
    let body: string;
    try {
      body = JSON.stringify(JSON.parse(raw) as unknown, null, 2);
    } catch {
      body = raw || '(пусто)';
    }
    const max = 16_000;
    if (body.length > max) {
      body = `${body.slice(0, max)}\n… (обрезано, всего ${body.length} символов)`;
    }
    this.logger.log(`[${houseId}] MQTT ← ${topic}\n${body}`);
  }
}
