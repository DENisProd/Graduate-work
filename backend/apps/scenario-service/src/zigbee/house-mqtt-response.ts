import type { HouseMqttConfig } from './house-mqtt-config.repository';
import type { HouseMqttConnectionStatus } from './zigbee-mqtt.service';

export interface PublicHouseMqttConfig extends Omit<HouseMqttConfig, 'mqttPassword'> {
  hasMqttPassword: boolean;
  status?: HouseMqttConnectionStatus;
}

export function toPublicHouseMqttConfig(
  config: HouseMqttConfig,
  status?: HouseMqttConnectionStatus,
): PublicHouseMqttConfig {
  const { mqttPassword, ...rest } = config;
  return {
    ...rest,
    hasMqttPassword: Boolean(mqttPassword?.trim()),
    ...(status ? { status } : {}),
  };
}
