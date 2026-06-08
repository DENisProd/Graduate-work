import type { HouseMqttConfig } from './house-mqtt-config.repository';
import type { HouseMqttConnectionStatus } from './zigbee-mqtt.service';

/** Public API shape — mqttUsername/mqttPassword in DB are local-server credentials only. */
export interface PublicHouseMqttConfig {
  houseId: string;
  mqttUrl: string;
  localServerUsername?: string;
  hasLocalServerPassword: boolean;
  topicPrefix: string;
  enabled: boolean;
  status?: HouseMqttConnectionStatus;
}

export function toPublicHouseMqttConfig(
  config: HouseMqttConfig,
  status?: HouseMqttConnectionStatus,
): PublicHouseMqttConfig {
  const { mqttPassword, mqttUsername, ...rest } = config;
  return {
    ...rest,
    localServerUsername: mqttUsername,
    hasLocalServerPassword: Boolean(mqttPassword?.trim()),
    ...(status ? { status } : {}),
  };
}
