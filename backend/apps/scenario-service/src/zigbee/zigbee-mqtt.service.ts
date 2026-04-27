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
import { ZigbeeIngestService } from './zigbee-ingest.service';

@Injectable()
export class ZigbeeMqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ZigbeeMqttService.name);
  private client: MqttClient | null = null;
  /** Префикс топиков (например zigbee2mqtt), без завершающего `/`. */
  private topicPrefix: string | null = null;

  constructor(
    private readonly config: ConfigService,
    @Inject(forwardRef(() => ZigbeeIngestService))
    private readonly ingest: ZigbeeIngestService,
  ) {}

  onModuleInit(): void {
    const url =
      this.config.get<string>('ZIGBEE_MQTT_URL')?.trim() ??
      process.env.ZIGBEE_MQTT_URL?.trim();
    if (!url) {
      this.logger.log('ZIGBEE_MQTT_URL не задан — MQTT (zigbee2mqtt) отключён');
      return;
    }

    const topicBase = (
      this.config.get<string>('ZIGBEE_MQTT_TOPIC_PREFIX')?.trim() ??
      process.env.ZIGBEE_MQTT_TOPIC_PREFIX?.trim() ??
      'zigbee2mqtt'
    ).replace(/\/+$/, '');

    this.topicPrefix = topicBase;

    const username =
      this.config.get<string>('ZIGBEE_MQTT_USERNAME') ??
      process.env.ZIGBEE_MQTT_USERNAME;
    const password =
      this.config.get<string>('ZIGBEE_MQTT_PASSWORD') ??
      process.env.ZIGBEE_MQTT_PASSWORD;

    const opts: IClientOptions = {
      reconnectPeriod: 5000,
      connectTimeout: 10_000,
      clientId: `scenario-service-${process.pid}-${Math.random().toString(36).slice(2, 10)}`,
    };
    if (username !== undefined && username !== '') opts.username = username;
    if (password !== undefined && password !== '') opts.password = password;

    this.client = mqtt.connect(url, opts);

    this.client.on('connect', () => {
      this.logger.log(`MQTT подключён: ${url}`);
      const pattern = `${topicBase}/#`;
      this.client?.subscribe(pattern, { qos: 0 }, (err) => {
        if (err) {
          this.logger.error(`Подписка MQTT не удалась: ${pattern}`, err);
          return;
        }
        this.logger.log(`Подписка: ${pattern}`);
        this.maybeRequestBridgeDevicesAfterSubscribe();
      });
    });

    this.client.on('message', (topic, payload) => {
      this.logIncomingMqtt(topic, payload);
      void this.ingest.processMqttMessage(topicBase, topic, payload);
    });

    this.client.on('error', (err) => {
      this.logger.error('MQTT ошибка', err);
    });

    this.client.on('reconnect', () => {
      this.logger.warn('MQTT переподключение…');
    });
  }

  onModuleDestroy(): void {
    if (this.client) {
      this.client.removeAllListeners();
      this.client.end(true);
      this.client = null;
    }
    this.topicPrefix = null;
  }

  /**
   * Публикует запрос в zigbee2mqtt: ответ придёт в `…/bridge/devices` и будет разобран {@link ZigbeeIngestService}.
   */
  requestBridgeDeviceList(): { ok: true } | { ok: false; error: string } {
    if (!this.client?.connected || !this.topicPrefix) {
      return { ok: false, error: 'MQTT не подключён' };
    }
    const topic = `${this.topicPrefix}/bridge/request/devices`;
    this.client.publish(topic, '{}', { qos: 0 }, (err) => {
      if (err) this.logger.error(`Ошибка publish ${topic}`, err);
    });
    this.logger.log(`Запрос списка устройств у моста: ${topic}`);
    return { ok: true };
  }

  /**
   * Включает / выключает режим сопряжения (permit_join) на мосту zigbee2mqtt.
   * `time` — таймаут в секундах (1–254), используется только при включении.
   */
  permitJoin(
    enable: boolean,
    time = 254,
  ): { ok: true } | { ok: false; error: string } {
    if (!this.client?.connected || !this.topicPrefix) {
      return { ok: false, error: 'MQTT не подключён' };
    }
    const topic = `${this.topicPrefix}/bridge/request/permit_join`;
    // Zigbee2MQTT payload compatibility:
    // - Some setups reject JSON objects with "Invalid payload".
    // - Publishing a number (seconds) is widely accepted to enable permit_join for that duration.
    // - Publishing `false` disables permit_join.
    const t = Math.max(1, Math.min(254, Math.trunc(time)));
    const body = enable ? String(t) : 'false';
    this.client.publish(topic, body, { qos: 0 }, (err) => {
      if (err) this.logger.error(`Ошибка publish ${topic}`, err);
    });
    this.logger.log(`MQTT → ${topic}\n${body}`);
    return { ok: true };
  }

  /**
   * Удаляет устройство с Zigbee-координатора через `…/bridge/request/device/remove`.
   * `idOrName` — friendlyName или IEEE-адрес.
   * `force` — принудительное удаление (для недоступных устройств).
   */
  removeDevice(
    idOrName: string,
    force = false,
  ): { ok: true } | { ok: false; error: string } {
    if (!this.client?.connected || !this.topicPrefix) {
      return { ok: false, error: 'MQTT не подключён' };
    }
    const topic = `${this.topicPrefix}/bridge/request/device/remove`;
    const body = JSON.stringify({ id: idOrName, force });
    this.client.publish(topic, body, { qos: 0 }, (err) => {
      if (err) this.logger.error(`Ошибка publish ${topic}`, err);
    });
    this.logger.log(`MQTT → ${topic}\n${body}`);
    return { ok: true };
  }

  /**
   * Отправляет команду управления Zigbee-устройству через топик `…/<topicName>/set`.
   * `topicName` — friendlyName или IEEE-адрес (zigbee2mqtt принимает оба варианта).
   */
  sendDeviceCommand(
    topicName: string,
    payload: Record<string, unknown>,
  ): { ok: true; topic: string } | { ok: false; error: string } {
    if (!this.client?.connected || !this.topicPrefix) {
      return { ok: false, error: 'MQTT не подключён' };
    }
    const topic = `${this.topicPrefix}/${topicName}/set`;
    const body = JSON.stringify(payload);
    this.client.publish(topic, body, { qos: 0 }, (err) => {
      if (err) this.logger.error(`Ошибка publish ${topic}`, err);
    });
    this.logger.log(`MQTT → ${topic}\n${body}`);
    return { ok: true, topic };
  }

  private maybeRequestBridgeDevicesAfterSubscribe(): void {
    const v =
      this.config.get<string>('ZIGBEE_MQTT_REQUEST_DEVICES_ON_CONNECT') ??
      process.env.ZIGBEE_MQTT_REQUEST_DEVICES_ON_CONNECT;
    if (v === '0' || v === 'false' || v === 'off') return;
    this.requestBridgeDeviceList();
  }

  /** Вывод входящих сообщений в консоль (как в примере с client.on('message')). */
  private logIncomingMqtt(topic: string, payload: Buffer): void {
    const raw = payload.toString();
    let body: string;
    try {
      const parsed = JSON.parse(raw) as unknown;
      body = JSON.stringify(parsed, null, 2);
    } catch {
      body = raw || '(пусто)';
    }
    const max =
      Number(
        this.config.get<string>('ZIGBEE_MQTT_LOG_MAX_CHARS') ??
          process.env.ZIGBEE_MQTT_LOG_MAX_CHARS,
      ) || 16_000;
    if (body.length > max) {
      body = `${body.slice(0, max)}\n… (обрезано, всего ${body.length} символов)`;
    }
    this.logger.log(`MQTT ← ${topic}\n${body}`);
  }
}
