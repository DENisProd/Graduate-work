import type { HouseMqttConfig } from './house-mqtt-config.repository';
import type { HouseMqttConnectionStatus } from './zigbee-mqtt.service';
import type { EmqxClientPresence } from './emqx-provision.service';

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
  localServer?: EmqxClientPresence,
): PublicHouseMqttConfig {
  const { mqttPassword, mqttUsername, ...rest } = config;
  const mergedStatus =
    status && localServer
      ? { ...status, localServer }
      : status;
  return {
    ...rest,
    localServerUsername: mqttUsername,
    hasLocalServerPassword: Boolean(mqttPassword?.trim()),
    ...(mergedStatus ? { status: mergedStatus } : {}),
  };
}
