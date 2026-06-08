import type { ConfigService } from '@nestjs/config';
import { houseDataPrefix } from './mqtt-topics';

const CENTRAL_ALIASES = new Set(['central', '__central__']);

export function centralMqttUrl(config: ConfigService): string | undefined {
  const url = config.get<string>('CENTRAL_MQTT_URL')?.trim();
  return url ? url.replace(/\/+$/, '') : undefined;
}

export function resolveHouseMqttUrl(config: ConfigService, mqttUrl: string): string {
  const trimmed = mqttUrl.trim().replace(/\/+$/, '');
  if (CENTRAL_ALIASES.has(trimmed)) {
    const central = centralMqttUrl(config);
    if (!central) {
      throw new Error('CENTRAL_MQTT_URL is not configured');
    }
    return central;
  }
  return trimmed;
}

export function usesCentralBroker(config: ConfigService, mqttUrl: string): boolean {
  const trimmed = mqttUrl.trim().replace(/\/+$/, '');
  if (CENTRAL_ALIASES.has(trimmed)) return true;
  const central = centralMqttUrl(config);
  return Boolean(central && trimmed === central);
}

export function resolveHouseTopicPrefix(
  config: ConfigService,
  houseId: string,
  mqttUrl: string,
  topicPrefix?: string,
): string {
  const prefix = (topicPrefix ?? '').trim();
  if (prefix && !(usesCentralBroker(config, mqttUrl) && prefix === 'zigbee2mqtt')) {
    return prefix.replace(/\/+$/, '');
  }
  if (usesCentralBroker(config, mqttUrl)) {
    return houseDataPrefix(houseId);
  }
  return prefix || 'zigbee2mqtt';
}

export function mqttClientCredentials(
  config: ConfigService,
  house?: { mqttUsername?: string; mqttPassword?: string },
): { username?: string; password?: string } {
  const username =
    house?.mqttUsername?.trim() || config.get<string>('CENTRAL_MQTT_USERNAME')?.trim() || undefined;
  const password =
    house?.mqttPassword?.trim() || config.get<string>('CENTRAL_MQTT_PASSWORD')?.trim() || undefined;
  return { username, password };
}
