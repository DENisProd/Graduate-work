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

interface PendingRequest {
  resolve: (data: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
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

const COMMAND_TOPIC = 'modbus/command';
const RESPONSE_TOPIC = 'modbus/response';
const TIMEOUT_MS = 5000;

@Injectable()
export class ModbusGatewayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ModbusGatewayService.name);
  private client: MqttClient | null = null;
  private readonly pending = new Map<string, PendingRequest>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url =
      this.config.get<string>('MODBUS_MQTT_URL') ??
      this.config.get<string>('CENTRAL_MQTT_URL') ??
      this.config.get<string>('ZIGBEE_MQTT_URL');
    if (!url) {
      this.logger.warn('MODBUS_MQTT_URL not configured — modbus gateway disabled');
      return;
    }

    const username = this.config.get<string>('CENTRAL_MQTT_USERNAME')?.trim();
    const password = this.config.get<string>('CENTRAL_MQTT_PASSWORD')?.trim();
    this.client = mqtt.connect(url, {
      reconnectPeriod: 5000,
      ...(username ? { username } : {}),
      ...(password ? { password } : {}),
    });

    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker for modbus: ${url}`);
      this.client!.subscribe(RESPONSE_TOPIC, (err) => {
        if (err) this.logger.error('Failed to subscribe to modbus/response', err);
      });
    });

    this.client.on('message', (topic, payload) => {
      if (topic !== RESPONSE_TOPIC) return;
      let response: ModbusResponse;
      try {
        response = JSON.parse(payload.toString()) as ModbusResponse;
      } catch {
        return;
      }
      const pending = this.pending.get(response.request_id);
      if (!pending) return;
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
    return this.client !== null && this.client.connected;
  }

  async sendCommand(command: Omit<ModbusCommand, 'request_id'>): Promise<number[]> {
    if (!this.client) {
      throw new Error('Modbus gateway not configured');
    }

    const requestId = randomUUID();
    const payload: ModbusCommand = { ...command, request_id: requestId };

    return new Promise<number[]>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error('Modbus request timeout'));
      }, TIMEOUT_MS);

      this.pending.set(requestId, {
        resolve: (data) => resolve(data as number[]),
        reject,
        timer,
      });

      this.client!.publish(COMMAND_TOPIC, JSON.stringify(payload), (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(requestId);
          reject(err);
        }
      });
    });
  }
}
