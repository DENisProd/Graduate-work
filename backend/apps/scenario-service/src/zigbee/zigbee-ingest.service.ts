import { Injectable, Logger } from '@nestjs/common';
import { ZigbeeService } from './zigbee.service';

function parseJson(payload: Buffer): unknown {
  const s = payload.toString().trim();
  if (!s) return undefined;
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return undefined;
  }
}

function parseJsonObject(buf: Buffer): Record<string, unknown> | null {
  const v = parseJson(buf);
  if (v === null || v === undefined) return null;
  if (typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return { value: v as string | number | boolean };
}

/**
 * Обрабатывает все входящие сообщения zigbee2mqtt (топики под префиксом).
 * Транспорт (MQTT) остаётся в {@link ZigbeeMqttService}.
 */
@Injectable()
export class ZigbeeIngestService {
  private readonly logger = new Logger(ZigbeeIngestService.name);

  constructor(private readonly zigbee: ZigbeeService) {}

  async processMqttMessage(
    topicBase: string,
    topic: string,
    payload: Buffer,
  ): Promise<void> {
    const prefix = `${topicBase}/`;
    if (topic !== topicBase && !topic.startsWith(prefix)) return;

    const relative = topic === topicBase ? '' : topic.slice(prefix.length);
    if (relative === '') return;

    try {
      if (relative === 'bridge/devices') {
        await this.onBridgeDevices(payload);
        return;
      }
      if (relative === 'bridge/event') {
        await this.onBridgeEvent(payload);
        return;
      }
      if (relative === 'bridge/state') {
        this.onBridgeState(payload);
        return;
      }
      if (relative === 'bridge/info') {
        this.onBridgeInfo(payload);
        return;
      }
      if (relative === 'bridge/health') {
        this.onBridgeHealth(payload);
        return;
      }
      if (relative === 'bridge/logging') {
        return;
      }
      if (relative === 'bridge/extensions') {
        return;
      }
      if (relative.startsWith('bridge/response')) {
        this.onBridgeResponse(relative, payload);
        return;
      }
      if (relative.startsWith('bridge/')) {
        this.logger.debug(`bridge (без отдельного обработчика): ${relative}`);
        return;
      }

      if (relative.includes('/')) return;

      await this.onDeviceTelemetry(relative, payload);
    } catch (e) {
      this.logger.error(
        `Ошибка обработки Zigbee MQTT ${topic}: ${e instanceof Error ? e.message : String(e)}`,
        e instanceof Error ? e.stack : undefined,
      );
    }
  }

  private async onBridgeDevices(payload: Buffer): Promise<void> {
    const raw = parseJson(payload);
    if (raw === undefined && payload.toString().trim() !== '') {
      this.logger.warn('bridge/devices: невалидный JSON');
      return;
    }
    await this.zigbee.syncDevicesFromZigbee2MqttBridge(raw);
    this.logger.debug(
      `bridge/devices: синхронизация (${Array.isArray(raw) ? raw.length : 0} устройств)`,
    );
  }

  private async onBridgeEvent(payload: Buffer): Promise<void> {
    const obj = parseJsonObject(payload);
    if (!obj) {
      this.logger.warn('bridge/event: пустой или невалидный JSON');
      return;
    }
    await this.zigbee.applyBridgeEvent(obj);
  }

  private onBridgeState(payload: Buffer): void {
    const obj = parseJsonObject(payload);
    if (!obj) return;
    const permitJoin = obj.permit_join;
    this.logger.debug(
      `bridge/state: permit_join=${String(permitJoin)}, coordinator=${String(obj.coordinator ?? '')}`,
    );
  }

  private onBridgeInfo(payload: Buffer): void {
    const raw = parseJson(payload);
    const n =
      typeof raw === 'object' &&
      raw !== null &&
      !Array.isArray(raw) &&
      'commit' in raw
        ? String((raw as Record<string, unknown>).commit ?? '')
        : '';
    this.logger.debug(
      `bridge/info: получено (${Buffer.byteLength(payload)} байт)${n ? ` commit=${n}` : ''}`,
    );
  }

  private onBridgeHealth(payload: Buffer): void {
    const obj = parseJsonObject(payload);
    if (!obj) return;
    const mqtt = obj.mqtt;
    const mq =
      mqtt && typeof mqtt === 'object' && !Array.isArray(mqtt)
        ? (mqtt as Record<string, unknown>)
        : null;
    this.logger.debug(
      `bridge/health: mqtt.connected=${String(mq?.connected ?? '')}`,
    );
  }

  private onBridgeResponse(relative: string, payload: Buffer): void {
    const obj = parseJsonObject(payload);
    this.logger.debug(
      `bridge/response ${relative}: ${obj ? JSON.stringify(obj).slice(0, 200) : '(не JSON)'}`,
    );
  }

  private async onDeviceTelemetry(
    friendlyName: string,
    payload: Buffer,
  ): Promise<void> {
    const data = parseJsonObject(payload);
    if (!data) return;
    await this.zigbee.ingestMqttDeviceState(friendlyName, data);
  }
}
