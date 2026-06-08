import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import type { IClientOptions, MqttClient } from 'mqtt';
import {
  resolveHouseMqttUrl,
  resolveHouseTopicPrefix,
  scenarioServiceMqttCredentials,
} from './central-mqtt';
import { ZigbeeIngestService } from './zigbee-ingest.service';
import { HouseMqttConfigRepository, HouseMqttConfig } from './house-mqtt-config.repository';
import { EmqxBootstrapService } from './emqx-bootstrap.service';

interface ConnectionEntry {
  client: MqttClient;
  topicPrefix: string;
  houseId: string;
  mqttUrl: string;
  connectedAt?: Date;
  lastMessageAt?: Date;
}

export interface HouseMqttConnectionStatus {
  connected: boolean;
  url?: string;
  lastError?: string;
  connectedAt?: string;
  lastMessageAt?: string;
  localServer?: {
    connected: boolean;
    username: string;
    clientId?: string;
    connectedAt?: string;
  };
}

@Injectable()
export class ZigbeeMqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ZigbeeMqttService.name);
  private readonly connections = new Map<string, ConnectionEntry>();
  private readonly lastErrors = new Map<string, string>();

  constructor(
    private readonly config: ConfigService,
    private readonly configRepo: HouseMqttConfigRepository,
    private readonly emqxBootstrap: EmqxBootstrapService,
    @Inject(forwardRef(() => ZigbeeIngestService))
    private readonly ingest: ZigbeeIngestService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.emqxBootstrap.waitReady();
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

    const houseId = config.houseId;
    let mqttUrl: string;
    try {
      mqttUrl = resolveHouseMqttUrl(this.config, config.mqttUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.lastErrors.set(houseId, message);
      this.logger.error(`[${houseId}] ${message}`);
      return;
    }
    const topicPrefix = resolveHouseTopicPrefix(
      this.config,
      houseId,
      config.mqttUrl,
      config.topicPrefix,
    );
    this.lastErrors.delete(houseId);

    const creds = scenarioServiceMqttCredentials(this.config);
    if (!creds.username || !creds.password) {
      const message = 'CENTRAL_MQTT_USERNAME and CENTRAL_MQTT_PASSWORD must be set for scenario-service';
      this.lastErrors.set(houseId, message);
      this.logger.error(`[${houseId}] ${message}`);
      return;
    }
    const opts: IClientOptions = {
      reconnectPeriod: 5000,
      connectTimeout: 10_000,
      clientId: `scenario-${houseId.slice(0, 8)}-${Math.random().toString(36).slice(2, 8)}`,
    };
    if (creds.username) opts.username = creds.username;
    if (creds.password) opts.password = creds.password;

    const client = mqtt.connect(mqttUrl, opts);
    const entry: ConnectionEntry = { client, topicPrefix, houseId, mqttUrl };
    this.connections.set(houseId, entry);

    client.on('connect', () => {
      this.lastErrors.delete(houseId);
      entry.connectedAt = new Date();
      this.logger.log(`[${houseId}] MQTT подключён: ${mqttUrl}`);
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
      entry.lastMessageAt = new Date();
      this.logIncoming(houseId, topic, payload);
      void this.ingest.processMqttMessage(houseId, topicPrefix, topic, payload);
    });

    client.on('error', (err) => {
      const message = err instanceof Error ? err.message : String(err);
      this.lastErrors.set(houseId, message);
      this.logger.error(`[${houseId}] MQTT ошибка`, err);
    });

    client.on('offline', () => {
      if (!client.connected) {
        entry.connectedAt = undefined;
        this.lastErrors.set(
          houseId,
          this.lastErrors.get(houseId) ?? 'MQTT broker offline or unreachable',
        );
      }
    });

    client.on('reconnect', () => {
      this.logger.warn(`[${houseId}] MQTT переподключение…`);
    });
  }

  waitForConnection(houseId: string, timeoutMs = 10_000): Promise<HouseMqttConnectionStatus> {
    const entry = this.connections.get(houseId);
    if (!entry) {
      return Promise.resolve({
        connected: false,
        lastError: 'MQTT client not initialized',
      });
    }

    if (entry.client.connected) {
      return Promise.resolve(this.getConnectionStatus(houseId));
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        entry.client.off('connect', onConnect);
        resolve(this.getConnectionStatus(houseId));
      };

      const timer = setTimeout(finish, timeoutMs);

      const onConnect = () => {
        finish();
      };

      entry.client.on('connect', onConnect);
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
    this.lastErrors.delete(houseId);
  }

  getConnectionStatus(houseId: string): HouseMqttConnectionStatus {
    const entry = this.connections.get(houseId);
    if (!entry) {
      return {
        connected: false,
        lastError: this.lastErrors.get(houseId),
      };
    }
    const lastError = entry.client.connected ? undefined : this.lastErrors.get(houseId);
    return {
      connected: entry.client.connected,
      url: entry.mqttUrl,
      lastError,
      connectedAt: entry.connectedAt?.toISOString(),
      lastMessageAt: entry.lastMessageAt?.toISOString(),
    };
  }

  getAllStatuses(): Record<string, HouseMqttConnectionStatus> {
    const result: Record<string, HouseMqttConnectionStatus> = {};
    for (const houseId of this.connections.keys()) {
      result[houseId] = this.getConnectionStatus(houseId);
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
