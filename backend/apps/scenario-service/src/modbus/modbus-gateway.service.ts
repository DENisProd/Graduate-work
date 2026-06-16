import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';
import { randomUUID } from 'crypto';
import { HouseMqttConfigRepository } from '../zigbee/house-mqtt-config.repository';
import {
  resolveHouseMqttUrl,
  scenarioServiceMqttCredentials,
} from '../zigbee/central-mqtt';

interface PendingRequest {
  resolve: (data: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  houseId: string;
}

interface ModbusCommand {
  action: 'read' | 'write';
  slave_id: number;
  register_type: 'holding' | 'input' | 'coil' | 'discrete';
  address: number;
  count?: number;
  value?: number;
  values?: number[];
  coil?: boolean;
  request_id: string;
}

interface ModbusResponse {
  request_id: string;
  success: boolean;
  raw_values?: number[];
  error?: string;
}

const TIMEOUT_MS = 5000;

function commandTopic(houseId: string): string {
  return `houses/${houseId}/modbus/command`;
}

function responseTopic(houseId: string): string {
  return `houses/${houseId}/modbus/response`;
}

@Injectable()
export class ModbusGatewayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ModbusGatewayService.name);
  private client: MqttClient | null = null;
  private readonly pending = new Map<string, PendingRequest>();
  private houseIds: string[] = [];

  constructor(
    private readonly config: ConfigService,
    private readonly houseMqttConfig: HouseMqttConfigRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const configs = await this.houseMqttConfig.findAll();
    this.houseIds = configs.filter((c) => c.enabled).map((c) => c.houseId);
    const fallback = this.config.get<string>('MODBUS_HOUSE_ID')?.trim();
    if (this.houseIds.length === 0 && fallback) {
      this.houseIds = [fallback];
    }
    if (this.houseIds.length === 0) {
      this.logger.warn(
        'No enabled house MQTT configs — modbus gateway disabled (set MODBUS_HOUSE_ID to override)',
      );
      return;
    }

    let mqttUrl: string;
    try {
      mqttUrl = resolveHouseMqttUrl(this.config, 'central');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Modbus gateway: ${message}`);
      return;
    }

    const creds = scenarioServiceMqttCredentials(this.config);
    this.client = mqtt.connect(mqttUrl, {
      reconnectPeriod: 5000,
      ...(creds.username ? { username: creds.username } : {}),
      ...(creds.password ? { password: creds.password } : {}),
    });

    this.client.on('connect', () => {
      this.logger.log(
        `Connected to MQTT broker for modbus: ${mqttUrl} (houses: ${this.houseIds.join(', ')})`,
      );
      for (const houseId of this.houseIds) {
        const topic = responseTopic(houseId);
        this.client!.subscribe(topic, (err) => {
          if (err) this.logger.error(`Failed to subscribe to ${topic}`, err);
        });
      }
    });

    this.client.on('message', (topic, payload) => {
      const houseId = this.houseIdFromResponseTopic(topic);
      if (!houseId) return;
      let response: ModbusResponse;
      try {
        response = JSON.parse(payload.toString()) as ModbusResponse;
      } catch {
        return;
      }
      const pending = this.pending.get(response.request_id);
      if (!pending || pending.houseId !== houseId) return;
      clearTimeout(pending.timer);
      this.pending.delete(response.request_id);
      if (response.success) {
        pending.resolve(response.raw_values ?? []);
      } else {
        pending.reject(new Error(response.error ?? 'Modbus error'));
      }
    });

    this.client.on('error', (err) => this.logger.error('MQTT error', err));
  }

  onModuleDestroy(): void {
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error('Module destroyed'));
    }
    this.pending.clear();
    if (this.client) {
      this.client.on('error', () => {});
      this.client.end(true);
    }
  }

  get isAvailable(): boolean {
    return this.client !== null && this.client.connected && this.houseIds.length > 0;
  }

  async sendCommand(
    command: Omit<ModbusCommand, 'request_id'>,
    houseId?: string,
  ): Promise<number[]> {
    if (!this.client) {
      throw new Error('Modbus gateway not configured');
    }
    const targetHouse = houseId ?? this.houseIds[0];
    if (!targetHouse) {
      throw new Error('Modbus houseId not configured');
    }

    const requestId = randomUUID();
    const payload: ModbusCommand = { ...command, request_id: requestId };
    const topic = commandTopic(targetHouse);

    return new Promise<number[]>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error('Modbus request timeout'));
      }, TIMEOUT_MS);

      this.pending.set(requestId, {
        resolve: (data) => resolve(data as number[]),
        reject,
        timer,
        houseId: targetHouse,
      });

      this.client!.publish(topic, JSON.stringify(payload), (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(requestId);
          reject(err);
        }
      });
    });
  }

  private houseIdFromResponseTopic(topic: string): string | null {
    const prefix = 'houses/';
    const suffix = '/modbus/response';
    if (!topic.startsWith(prefix) || !topic.endsWith(suffix)) return null;
    const rest = topic.slice(prefix.length, topic.length - suffix.length);
    return rest || null;
  }
}
